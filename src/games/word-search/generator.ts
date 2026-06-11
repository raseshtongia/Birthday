import type {
  Cell,
  DirectionKey,
  GeneratedPuzzle,
  PlacedWord,
  PuzzleConfig,
} from './types';

const DIRECTIONS: Record<DirectionKey, { row: number; col: number }> = {
  E: { row: 0, col: 1 },
  W: { row: 0, col: -1 },
  S: { row: 1, col: 0 },
  N: { row: -1, col: 0 },
  SE: { row: 1, col: 1 },
  SW: { row: 1, col: -1 },
  NE: { row: -1, col: 1 },
  NW: { row: -1, col: -1 },
};

const SUPPORTED_SIZES = new Set([20, 25, 30, 35, 40, 45, 50]);
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const normalizeWord = (word: string) =>
  word.toUpperCase().replace(/[^A-Z]/g, '');

const hashSeed = (seed: string) => {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createRandom = (seed: string) => {
  let state = hashSeed(seed) || 1;

  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(items: T[], random: () => number) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

const isDirectionKey = (direction: string): direction is DirectionKey =>
  direction in DIRECTIONS;

const getCellsForPlacement = (
  startRow: number,
  startCol: number,
  wordLength: number,
  direction: DirectionKey,
) => {
  const delta = DIRECTIONS[direction];
  const cells: Cell[] = [];

  for (let index = 0; index < wordLength; index += 1) {
    cells.push({
      row: startRow + delta.row * index,
      col: startCol + delta.col * index,
    });
  }

  return cells;
};

const canPlaceWord = (grid: string[][], word: string, cells: Cell[]) =>
  cells.every(({ row, col }, index) => {
    const existingLetter = grid[row]?.[col];
    return existingLetter !== undefined && (existingLetter === '' || existingLetter === word[index]);
  });

const getPlacementScore = (grid: string[][], word: string, cells: Cell[]) =>
  cells.reduce((score, { row, col }, index) => {
    const existingLetter = grid[row]?.[col];

    if (existingLetter === word[index]) {
      return score + (index === 0 ? 6 : 3);
    }

    return score;
  }, 0);

const validatePuzzle = (puzzle: PuzzleConfig) => {
  if (!SUPPORTED_SIZES.has(puzzle.size)) {
    throw new Error(`Unsupported grid size "${puzzle.size}". Use 20, 25, 30, 35, 40, 45, or 50.`);
  }

  if (!puzzle.words.length) {
    throw new Error('Puzzle must include at least one word.');
  }

  puzzle.allowedDirections.forEach((direction) => {
    if (!isDirectionKey(direction)) {
      throw new Error(`Unsupported direction "${direction}".`);
    }
  });
};

export const generateWordSearch = (puzzle: PuzzleConfig): GeneratedPuzzle => {
  validatePuzzle(puzzle);

  const random = createRandom(puzzle.seed);
  const grid = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, () => ''),
  );
  const placedWords: PlacedWord[] = [];

  const sortedWords = [...puzzle.words].sort(
    (a, b) => normalizeWord(b.text).length - normalizeWord(a.text).length,
  );

  sortedWords.forEach((wordConfig, wordIndex) => {
    const word = normalizeWord(wordConfig.text);

    if (!word) {
      throw new Error(`Word "${wordConfig.text}" does not contain any A-Z letters.`);
    }

    if (word.length > puzzle.size) {
      throw new Error(`"${wordConfig.text}" is longer than the ${puzzle.size} x ${puzzle.size} grid.`);
    }

    const requestedDirections = wordConfig.directions?.length
      ? wordConfig.directions
      : puzzle.allowedDirections;
    const directions = shuffle(requestedDirections, random);

    directions.forEach((direction) => {
      if (!isDirectionKey(direction)) {
        throw new Error(`Unsupported direction "${direction}" for word "${wordConfig.text}".`);
      }
    });

    const starts = shuffle(
      Array.from({ length: puzzle.size * puzzle.size }, (_, index) => ({
        row: Math.floor(index / puzzle.size),
        col: index % puzzle.size,
      })),
      random,
    );

    const candidates: Array<{
      direction: DirectionKey;
      cells: Cell[];
      score: number;
    }> = [];

    for (const direction of directions) {
      for (const start of starts) {
        const cells = getCellsForPlacement(start.row, start.col, word.length, direction);

        if (canPlaceWord(grid, word, cells)) {
          candidates.push({
            direction,
            cells,
            score: getPlacementScore(grid, word, cells),
          });
        }
      }
    }

    const placement = candidates.sort((a, b) => b.score - a.score)[0];

    if (!placement) {
      throw new Error(
        `Could not place "${wordConfig.text}". Try a larger grid or allow more directions.`,
      );
    }

    placement.cells.forEach(({ row, col }, letterIndex) => {
      grid[row][col] = word[letterIndex];
    });

    placedWords.push({
      id: `${word}-${wordIndex}`,
      text: word,
      displayText: wordConfig.text,
      direction: placement.direction,
      cells: placement.cells,
    });
  });

  grid.forEach((row) => {
    row.forEach((letter, colIndex) => {
      if (!letter) {
        row[colIndex] = ALPHABET[Math.floor(random() * ALPHABET.length)];
      }
    });
  });

  return { grid, placedWords };
};

export const getStraightLineCells = (start: Cell, end: Cell): Cell[] => {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const rowDistance = Math.abs(rowDelta);
  const colDistance = Math.abs(colDelta);
  const isStraight =
    rowDistance === 0 || colDistance === 0 || rowDistance === colDistance;

  if (!isStraight) {
    return [];
  }

  const length = Math.max(rowDistance, colDistance) + 1;

  return Array.from({ length }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index,
  }));
};
