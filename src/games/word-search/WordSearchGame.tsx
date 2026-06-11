import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import styles from './WordSearchGame.module.css';
import { generateWordSearch, getStraightLineCells } from './generator';
import type { Cell, PlacedWord, PuzzleConfig } from './types';

type WordSearchGameProps = {
  puzzle: PuzzleConfig;
};

const cellKey = (cell: Cell) => `${cell.row}-${cell.col}`;
const pathKey = (cells: Cell[]) => cells.map(cellKey).join('|');
const progressKey = (puzzle: PuzzleConfig) => `word-search-progress:${puzzle.id}`;

const getWordFromCells = (grid: string[][], cells: Cell[]) =>
  cells.map(({ row, col }) => grid[row]?.[col] ?? '').join('');

function WordSearchGame({ puzzle }: WordSearchGameProps) {
  const boardViewportRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef({ active: false, x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [foundWordIds, setFoundWordIds] = useState<Set<string>>(() => {
    const savedProgress = window.localStorage.getItem(progressKey(puzzle));

    if (!savedProgress) {
      return new Set();
    }

    try {
      const foundIds = JSON.parse(savedProgress) as string[];
      return new Set(foundIds);
    } catch {
      return new Set();
    }
  });
  const [selectionStart, setSelectionStart] = useState<Cell | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Cell | null>(null);
  const [zoom, setZoom] = useState(1);
  const [interactionMode, setInteractionMode] = useState<'select' | 'move'>('select');

  const generatedPuzzle = useMemo(() => generateWordSearch(puzzle), [puzzle]);
  const foundCells = useMemo(() => {
    const keys = new Set<string>();

    generatedPuzzle.placedWords.forEach((word) => {
      if (foundWordIds.has(word.id)) {
        word.cells.forEach((cell) => keys.add(cellKey(cell)));
      }
    });

    return keys;
  }, [foundWordIds, generatedPuzzle.placedWords]);

  const selectionCells = useMemo(() => {
    if (!selectionStart || !selectionEnd) {
      return [];
    }

    return getStraightLineCells(selectionStart, selectionEnd);
  }, [selectionStart, selectionEnd]);

  const selectionCellsSet = useMemo(
    () => new Set(selectionCells.map(cellKey)),
    [selectionCells],
  );

  const matchedWordIds = useMemo(() => {
    const selectedPath = pathKey(selectionCells);
    const reversedPath = pathKey([...selectionCells].reverse());
    const selectedWord = getWordFromCells(generatedPuzzle.grid, selectionCells);
    const reversedWord = [...selectedWord].reverse().join('');

    return generatedPuzzle.placedWords
      .filter((word) => {
        if (foundWordIds.has(word.id)) {
          return false;
        }

        const placedPath = pathKey(word.cells);
        return (
          placedPath === selectedPath ||
          placedPath === reversedPath ||
          word.text === selectedWord ||
          word.text === reversedWord
        );
      })
      .map((word) => word.id);
  }, [foundWordIds, generatedPuzzle.grid, generatedPuzzle.placedWords, selectionCells]);

  const foundCount = foundWordIds.size;
  const totalWords = generatedPuzzle.placedWords.length;
  const progress = Math.round((foundCount / totalWords) * 100);
  const foundWords = useMemo(
    () =>
      generatedPuzzle.placedWords
        .filter((word) => foundWordIds.has(word.id))
        .sort((a, b) => a.displayText.localeCompare(b.displayText)),
    [foundWordIds, generatedPuzzle.placedWords],
  );

  useEffect(() => {
    window.localStorage.setItem(progressKey(puzzle), JSON.stringify([...foundWordIds]));
  }, [foundWordIds, puzzle]);

  const finishSelection = () => {
    if (matchedWordIds.length) {
      setFoundWordIds((current) => {
        const next = new Set(current);
        matchedWordIds.forEach((wordId) => next.add(wordId));
        return next;
      });
    }

    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const updateSelectionFromPointer = (event: PointerEvent<HTMLElement>) => {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cellElement = target?.closest<HTMLButtonElement>('[data-row][data-col]');

    if (!cellElement) {
      return;
    }

    setSelectionEnd({
      row: Number(cellElement.dataset.row),
      col: Number(cellElement.dataset.col),
    });
  };

  const handleCellPointerDown = (event: PointerEvent<HTMLButtonElement>, cell: Cell) => {
    if (interactionMode !== 'select') {
      return;
    }

    event.preventDefault();
    boardViewportRef.current?.setPointerCapture(event.pointerId);
    setSelectionStart(cell);
    setSelectionEnd(cell);
  };

  const handleMovePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (interactionMode !== 'move' || !boardViewportRef.current) {
      return;
    }

    const viewport = boardViewportRef.current;
    panStateRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
  };

  const handleMovePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (selectionStart && interactionMode === 'select') {
      updateSelectionFromPointer(event);
      return;
    }

    if (!panStateRef.current.active || !boardViewportRef.current) {
      return;
    }

    const viewport = boardViewportRef.current;
    viewport.scrollLeft = panStateRef.current.scrollLeft - (event.clientX - panStateRef.current.x);
    viewport.scrollTop = panStateRef.current.scrollTop - (event.clientY - panStateRef.current.y);
  };

  const handleBoardPointerUp = () => {
    if (selectionStart && interactionMode === 'select') {
      finishSelection();
    }

    panStateRef.current.active = false;
  };

  const changeZoom = (nextZoom: number) => {
    setZoom(Math.min(1.8, Math.max(0.75, Number(nextZoom.toFixed(2)))));
  };

  const resetProgress = () => {
    setFoundWordIds(new Set());
    window.localStorage.removeItem(progressKey(puzzle));
  };

  return (
    <section
      className={styles.shell}
      style={
        {
          '--accent-color': puzzle.theme?.accent ?? '#d1495b',
          '--found-color': puzzle.theme?.found ?? '#2a9d8f',
          '--selection-color': puzzle.theme?.selection ?? '#f4a261',
        } as React.CSSProperties
      }
    >
      <div className={styles.gameHeader}>
        <div>
          <h2>{puzzle.title}</h2>
          {puzzle.friendName && <p className={styles.friendName}>For {puzzle.friendName}</p>}
          {puzzle.message && <p>{puzzle.message}</p>}
        </div>

        <div className={styles.progressPanel}>
          <span>
            {foundCount} / {totalWords} found
          </span>
          <div className={styles.progressTrack}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.segmentedControl} aria-label="Board interaction mode">
          <button
            className={interactionMode === 'select' ? styles.activeSegment : ''}
            type="button"
            onClick={() => setInteractionMode('select')}
          >
            Select
          </button>
          <button
            className={interactionMode === 'move' ? styles.activeSegment : ''}
            type="button"
            onClick={() => setInteractionMode('move')}
          >
            Move
          </button>
        </div>

        <div className={styles.zoomControls} aria-label="Board zoom controls">
          <button type="button" onClick={() => changeZoom(zoom - 0.15)}>
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => changeZoom(zoom + 0.15)}>
            +
          </button>
          <button type="button" onClick={() => changeZoom(1)}>
            Reset
          </button>
        </div>

        <button className={styles.resetProgressButton} type="button" onClick={resetProgress}>
          Clear progress
        </button>
      </div>

      <div className={styles.layout}>
        <div
          ref={boardViewportRef}
          className={`${styles.boardViewport} ${
            interactionMode === 'move' ? styles.moveMode : ''
          }`}
          onPointerDown={handleMovePointerDown}
          onPointerMove={handleMovePointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerCancel={handleBoardPointerUp}
        >
          <div
            className={styles.boardScaler}
            style={{
              '--grid-size': puzzle.size,
              '--zoom': zoom,
            } as React.CSSProperties}
          >
            <div
              className={styles.board}
              style={{
                gridTemplateColumns: `repeat(${puzzle.size}, var(--cell-size))`,
                transform: `scale(${zoom})`,
              }}
            >
              {generatedPuzzle.grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const cell = { row: rowIndex, col: colIndex };
                  const key = cellKey(cell);
                  const isFound = foundCells.has(key);
                  const isSelected = selectionCellsSet.has(key);
                  const isMatched = isSelected && matchedWordIds.length > 0;

                  return (
                    <button
                      className={`${styles.cell} ${isFound ? styles.foundCell : ''} ${
                        isSelected ? styles.selectedCell : ''
                      } ${isMatched ? styles.matchedCell : ''}`}
                      key={key}
                      type="button"
                      data-row={rowIndex}
                      data-col={colIndex}
                      onPointerDown={(event) => handleCellPointerDown(event, cell)}
                      disabled={interactionMode === 'move'}
                      aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${letter}`}
                    >
                      {letter}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        </div>

        <aside className={styles.progressWordsPanel}>
          <h3>Progress</h3>
          <p className={styles.hiddenWordsNote}>
            The answers are hidden. Correct selections will appear here.
          </p>
          <div className={styles.wordsList}>
            {foundWords.length === 0 ? (
              <span className={styles.emptyProgress}>No words found yet</span>
            ) : (
              foundWords.map((word: PlacedWord) => (
                <span className={`${styles.wordPill} ${styles.wordFound}`} key={word.id}>
                  {word.displayText}
                </span>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default WordSearchGame;
