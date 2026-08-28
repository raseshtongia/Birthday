import type { PuzzleConfig } from './types';

const GRID_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GRID_CODE_LENGTH = 6;

export const DEFAULT_GRID_CODE = 'default';
export const GRID_CODE_PARAM = 'grid';

export const normalizeGridCode = (code: string | null | undefined) => {
  const normalized = code?.trim().toUpperCase();

  if (!normalized) {
    return DEFAULT_GRID_CODE;
  }

  return /^[A-Z0-9]{6}$/.test(normalized) ? normalized : DEFAULT_GRID_CODE;
};

export const getGridCodeFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get(GRID_CODE_PARAM);
  return code ? normalizeGridCode(code) : DEFAULT_GRID_CODE;
};

export const gridCodeStorageKey = (puzzle: PuzzleConfig) =>
  `word-search-grid-code:${puzzle.id}`;

export const progressKey = (puzzle: PuzzleConfig, gridCode: string) =>
  `word-search-progress:${puzzle.id}:${normalizeGridCode(gridCode)}`;

export const legacyProgressKey = (puzzle: PuzzleConfig) =>
  `word-search-progress:${puzzle.id}`;

export const createGridCode = () => {
  const randomValues = new Uint32Array(GRID_CODE_LENGTH);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
  } else {
    randomValues.forEach((_, index) => {
      randomValues[index] = Math.floor(Math.random() * GRID_CODE_ALPHABET.length);
    });
  }

  return Array.from(
    randomValues,
    (value) => GRID_CODE_ALPHABET[value % GRID_CODE_ALPHABET.length],
  ).join('');
};

export const getPuzzleGridVariant = (puzzle: PuzzleConfig, gridCode: string): PuzzleConfig => {
  const normalizedGridCode = normalizeGridCode(gridCode);

  return {
    ...puzzle,
    seed: `${puzzle.seed}:grid:${normalizedGridCode}`,
  };
};

export const setGridCodeInUrl = (gridCode: string) => {
  const normalizedGridCode = normalizeGridCode(gridCode);
  const url = new URL(window.location.href);

  if (normalizedGridCode === DEFAULT_GRID_CODE) {
    url.searchParams.delete(GRID_CODE_PARAM);
  } else {
    url.searchParams.set(GRID_CODE_PARAM, normalizedGridCode);
  }

  window.history.replaceState({}, '', url);
};
