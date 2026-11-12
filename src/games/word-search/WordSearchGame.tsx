import { PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Expand, Hand, Maximize, Minimize, MousePointer2, RotateCcw, Shuffle, ZoomIn, ZoomOut } from 'lucide-react';
import styles from './WordSearchGame.module.css';
import PartyPoppers from './PartyPoppers';
import { generateWordSearch, getStraightLineCells } from './generator';
import {
  DEFAULT_GRID_CODE,
  createGridCode,
  getGridCodeFromUrl,
  getPuzzleGridVariant,
  gridCodeStorageKey,
  legacyProgressKey,
  normalizeGridCode,
  progressKey,
  setGridCodeInUrl,
} from './gridVariant';
import type { Cell, PlacedWord, PuzzleConfig } from './types';

type WordSearchGameProps = {
  puzzle: PuzzleConfig;
  headerActions?: ReactNode;
};

const cellKey = (cell: Cell) => `${cell.row}-${cell.col}`;
const pathKey = (cells: Cell[]) => cells.map(cellKey).join('|');
const CELEBRATIONS_STORAGE_KEY = 'birthday-word-search-celebrations';
const ANSWER_COLORS = [
  '#d1495b',
  '#2a9d8f',
  '#4f7cac',
  '#f2c14e',
  '#8e6c8a',
  '#e76f51',
  '#5b8e7d',
  '#7c6ff0',
  '#ef476f',
  '#118ab2',
];

const getWordFromCells = (grid: string[][], cells: Cell[]) =>
  cells.map(({ row, col }) => grid[row]?.[col] ?? '').join('');

function WordSearchGame({ puzzle, headerActions }: WordSearchGameProps) {
  const shellRef = useRef<HTMLElement>(null);
  const boardViewportRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef({ active: false, x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [gridCode, setGridCode] = useState(() => {
    const urlGridCode = getGridCodeFromUrl();

    if (urlGridCode !== DEFAULT_GRID_CODE) {
      return urlGridCode;
    }

    return normalizeGridCode(window.localStorage.getItem(gridCodeStorageKey(puzzle)));
  });
  const puzzleGridVariant = useMemo(
    () => getPuzzleGridVariant(puzzle, gridCode),
    [gridCode, puzzle],
  );
  const [foundWordIds, setFoundWordIds] = useState<Set<string>>(() => {
    const savedProgress =
      window.localStorage.getItem(progressKey(puzzle, gridCode)) ??
      (gridCode === DEFAULT_GRID_CODE
        ? window.localStorage.getItem(legacyProgressKey(puzzle))
        : null);

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
  const [fitGrid, setFitGrid] = useState(true);
  const [fitCellSize, setFitCellSize] = useState(20);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [celebrationsEnabled, setCelebrationsEnabled] = useState(() => {
    const saved = window.localStorage.getItem(CELEBRATIONS_STORAGE_KEY);
    return saved === null ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : saved === 'true';
  });
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'miss'; message: string; cells: string[] } | null>(null);
  const [interactionMode, setInteractionMode] = useState<'select' | 'move'>('select');

  const generatedPuzzle = useMemo(
    () => generateWordSearch(puzzleGridVariant),
    [puzzleGridVariant],
  );
  const wordColors = useMemo(() => {
    const colors = new Map<string, string>();

    generatedPuzzle.placedWords.forEach((word, index) => {
      colors.set(word.id, ANSWER_COLORS[index % ANSWER_COLORS.length]);
    });

    return colors;
  }, [generatedPuzzle.placedWords]);
  const foundCellColors = useMemo(() => {
    const colors = new Map<string, string>();

    generatedPuzzle.placedWords.forEach((word) => {
      if (foundWordIds.has(word.id)) {
        const color = wordColors.get(word.id) ?? puzzle.theme?.found ?? '#2a9d8f';
        word.cells.forEach((cell) => colors.set(cellKey(cell), color));
      }
    });

    return colors;
  }, [foundWordIds, generatedPuzzle.placedWords, puzzle.theme?.found, wordColors]);

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

  const validFoundWordIds = useMemo(() => new Set(
    [...foundWordIds].filter((id) => generatedPuzzle.placedWords.some((word) => word.id === id)),
  ), [foundWordIds, generatedPuzzle.placedWords]);
  const foundCount = validFoundWordIds.size;
  const totalWords = generatedPuzzle.placedWords.length;
  const progress = Math.round((foundCount / totalWords) * 100);
  const isComplete = foundCount === totalWords;
  const foundWords = useMemo(
    () => [...validFoundWordIds].reverse()
      .map((id) => generatedPuzzle.placedWords.find((word) => word.id === id)!),
    [validFoundWordIds, generatedPuzzle.placedWords],
  );

  useEffect(() => {
    const viewport = boardViewportRef.current;
    if (!viewport) return;
    const resize = () => {
      const style = getComputedStyle(viewport);
      const width = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = Math.min(window.innerHeight * 0.68, Math.max(160, window.innerHeight - viewport.getBoundingClientRect().top - 32));
      setFitCellSize(Math.max(1, Math.floor(Math.min(width, height) / puzzle.size)));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    window.addEventListener('resize', resize);
    resize();
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
  }, [puzzle.size, isFullscreen, isComplete]);

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const exit = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setIsFullscreen(false);
    };
    window.addEventListener('keydown', exit);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', exit);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 1600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const cellSize = fitGrid ? fitCellSize : 28 * zoom;
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shellRef.current?.requestFullscreen && document.fullscreenEnabled) await shellRef.current.requestFullscreen();
      else setIsFullscreen((current) => !current);
    } catch {
      setIsFullscreen((current) => !current);
    }
  };

  useEffect(() => {
    window.localStorage.setItem(progressKey(puzzle, gridCode), JSON.stringify([...foundWordIds]));
  }, [foundWordIds, gridCode, puzzle]);

  const finishSelection = () => {
    if (matchedWordIds.length) {
      if (celebrationsEnabled && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setCelebrationCount((current) => current + 1);
      }
      const names = generatedPuzzle.placedWords.filter((word) => matchedWordIds.includes(word.id)).map((word) => word.displayText);
      setFeedback({ kind: 'success', message: `${names.join(', ')} found!`, cells: selectionCells.map(cellKey) });
      setFoundWordIds((current) => {
        const next = new Set(current);
        matchedWordIds.forEach((wordId) => next.add(wordId));
        return next;
      });
    } else if (selectionStart && selectionEnd && cellKey(selectionStart) !== cellKey(selectionEnd)) {
      const alreadyFound = generatedPuzzle.placedWords.some((word) => validFoundWordIds.has(word.id) && (
        word.text === getWordFromCells(generatedPuzzle.grid, selectionCells) || word.text === getWordFromCells(generatedPuzzle.grid, [...selectionCells].reverse())
      ));
      setFeedback({ kind: 'miss', message: alreadyFound ? 'Already discovered' : 'Keep looking', cells: selectionCells.map(cellKey) });
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
    setFitGrid(false);
    setZoom(Math.min(3, Math.max(0.1, Number(nextZoom.toFixed(2)))));
  };

  const clearProgress = () => {
    if (!window.confirm('All your progress will be lost. The grid will stay the same.\n\nClear progress?')) {
      return;
    }

    setFoundWordIds(new Set());
    setFeedback(null);
    setSelectionStart(null);
    setSelectionEnd(null);
    window.localStorage.removeItem(progressKey(puzzle, gridCode));

    if (gridCode === DEFAULT_GRID_CODE) {
      window.localStorage.removeItem(legacyProgressKey(puzzle));
    }
  };

  const shuffleAndReset = () => {
    if (!window.confirm('All your progress will be lost and the grid will be rearranged.\n\nShuffle and reset?')) return;
    const nextGridCode = createGridCode();

    setFoundWordIds(new Set());
    setFeedback(null);
    setSelectionStart(null);
    setSelectionEnd(null);
    window.localStorage.removeItem(progressKey(puzzle, gridCode));
    window.localStorage.removeItem(legacyProgressKey(puzzle));
    window.localStorage.setItem(gridCodeStorageKey(puzzle), nextGridCode);
    setGridCode(nextGridCode);
    setGridCodeInUrl(nextGridCode);
  };

  return (
    <section
      ref={shellRef}
      className={`${styles.shell} ${isFullscreen ? styles.fullscreenShell : ''}`}
      style={
        {
          '--accent-color': puzzle.theme?.accent ?? '#d1495b',
          '--found-color': puzzle.theme?.found ?? '#2a9d8f',
          '--selection-color': puzzle.theme?.selection ?? '#f4a261',
          '--grid-size': puzzle.size,
          '--cell-size': `${cellSize}px`,
        } as React.CSSProperties
      }
    >
      {celebrationsEnabled && celebrationCount > 0 && <PartyPoppers key={celebrationCount} />}
      <div className={styles.gameHeader}>
        <div>
          <p className={styles.eyebrow}>{puzzle.pageEyebrow ?? 'Word search'}</p>
          <h1>{puzzle.title}</h1>
          {puzzle.message && <p>{puzzle.message}</p>}
        </div>

        <div className={styles.progressPanel}>
          <span>
            {foundCount} / {totalWords} found
          </span>
          <div className={styles.progressTrack} role="progressbar" aria-label="Words found" aria-valuemin={0} aria-valuemax={totalWords} aria-valuenow={foundCount}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className={styles.headerActions}>{headerActions}</div>
      </div>

      {isComplete && (
        <div className={styles.completeBanner} role="status">
          <Check size={24} aria-hidden="true" />
          <div><strong>Every word discovered!</strong>
          <p>{puzzle.completionMessage ?? `Beautifully done${puzzle.friendName ? `, ${puzzle.friendName}` : ''}! You found all ${totalWords} words.`}</p></div>
          <button type="button" className={styles.resetProgressButton} onClick={shuffleAndReset}><Shuffle size={16} aria-hidden="true" /> Play another grid</button>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.segmentedControl} aria-label="Board interaction mode">
          <button
            className={interactionMode === 'select' ? styles.activeSegment : ''}
            type="button"
            aria-pressed={interactionMode === 'select'}
            onClick={() => setInteractionMode('select')}
          >
            <MousePointer2 size={16} aria-hidden="true" /> Select
          </button>
          <button
            className={interactionMode === 'move' ? styles.activeSegment : ''}
            type="button"
            aria-pressed={interactionMode === 'move'}
            onClick={() => setInteractionMode('move')}
          >
            <Hand size={16} aria-hidden="true" /> Move
          </button>
        </div>

        <div className={styles.zoomControls} aria-label="Board zoom controls">
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => changeZoom(cellSize / 28 - 0.2)}>
            <ZoomOut size={17} aria-hidden="true" />
          </button>
          <span>{Math.round(cellSize / 28 * 100)}%</span>
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => changeZoom(cellSize / 28 + 0.2)}>
            <ZoomIn size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-pressed={fitGrid} onClick={() => { setFitGrid(true); boardViewportRef.current?.scrollTo(0, 0); }}>
            <Expand size={16} aria-hidden="true" /> Fit grid
          </button>
          <button type="button" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={17} aria-hidden="true" /> : <Maximize size={17} aria-hidden="true" />}
          </button>
        </div>

      </div>

      <div className={styles.feedbackRow}>
        <div className={styles.feedback} role="status" aria-live="polite">{feedback?.message ?? '\u00a0'}</div>
        <label className={styles.celebrationToggle}>
          <input type="checkbox" checked={celebrationsEnabled} onChange={(event) => {
            const enabled = event.target.checked;
            setCelebrationsEnabled(enabled);
            setCelebrationCount(0);
            window.localStorage.setItem(CELEBRATIONS_STORAGE_KEY, String(enabled));
          }} />
          Celebrations
        </label>
      </div>

      <div className={styles.layout}>
        <div
          ref={boardViewportRef}
          role="region"
          aria-label="Word search grid"
          tabIndex={0}
          className={`${styles.boardViewport} ${interactionMode === 'move' ? styles.moveMode : ''}`}
          onPointerDown={handleMovePointerDown}
          onPointerMove={handleMovePointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerCancel={() => { setSelectionStart(null); setSelectionEnd(null); panStateRef.current.active = false; }}
        >
          <div className={styles.boardScaler}>
            <div className={styles.board} style={{ gridTemplateColumns: `repeat(${puzzle.size}, var(--cell-size))` }}>
              {generatedPuzzle.grid.map((row, rowIndex) => row.map((letter, colIndex) => {
                const cell = { row: rowIndex, col: colIndex };
                const key = cellKey(cell);
                const foundColor = foundCellColors.get(key);
                const isSelected = selectionCellsSet.has(key);
                const matchedColor = isSelected && matchedWordIds[0] ? wordColors.get(matchedWordIds[0]) : undefined;
                const color = foundColor ?? matchedColor;
                const feedbackClass = feedback?.cells.includes(key) ? (feedback.kind === 'success' ? styles.successCell : styles.missCell) : '';
                return <button
                  className={`${styles.cell} ${foundColor ? styles.foundCell : ''} ${isSelected ? styles.selectedCell : ''} ${matchedColor ? styles.matchedCell : ''} ${feedbackClass}`}
                  style={color ? ({ '--word-color': color } as React.CSSProperties) : undefined}
                  key={key} type="button" data-row={rowIndex} data-col={colIndex}
                  onPointerDown={(event) => handleCellPointerDown(event, cell)}
                  disabled={interactionMode === 'move'}
                  aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${letter}`}
                >{letter}</button>;
              }))}
            </div>
          </div>
        </div>
        <aside className={styles.progressWordsPanel}>
          <h3>Words discovered <span>{foundCount}</span></h3>
          <div className={styles.wordsList}>
            {foundWords.length === 0 ? <span className={styles.emptyProgress}>No words found yet</span> : foundWords.map((word: PlacedWord) => (
              <span className={`${styles.wordPill} ${styles.wordFound}`} key={word.id}
                style={{ '--word-color': wordColors.get(word.id) ?? '#2a9d8f' } as React.CSSProperties}>
                <Check size={13} aria-hidden="true" /> {word.displayText}
              </span>
            ))}
          </div>
          <details className={styles.puzzleDetails}>
            <summary>Puzzle details</summary>
            <p>Grid code <code>{gridCode}</code></p>
            <p>{puzzle.pageTitle ?? puzzle.title}</p>
            {puzzle.pageSubtitle && <p>{puzzle.pageSubtitle}</p>}
            <p>{puzzle.size} \u00d7 {puzzle.size}</p>
          </details>
          <div className={styles.resetActions}>
            <button className={styles.resetProgressButton} type="button" onClick={clearProgress}><RotateCcw size={15} aria-hidden="true" /> Clear progress</button>
            <button className={`${styles.resetProgressButton} ${styles.shuffleButton}`} type="button" onClick={shuffleAndReset}><Shuffle size={15} aria-hidden="true" /> Shuffle and reset</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default WordSearchGame;
