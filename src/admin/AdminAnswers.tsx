import { FormEvent, useMemo, useState } from 'react';
import styles from './AdminAnswers.module.css';
import { generateWordSearch } from '../games/word-search/generator';
import {
  DEFAULT_GRID_CODE,
  getGridCodeFromUrl,
  getPuzzleGridVariant,
  normalizeGridCode,
} from '../games/word-search/gridVariant';
import type { Cell, PuzzleConfig } from '../games/word-search/types';
import ThemeToggle from '../theme/ThemeToggle';
import type { useTheme } from '../theme/useTheme';

type AdminAnswersProps = {
  puzzles: PuzzleConfig[];
  theme: ReturnType<typeof useTheme>;
};

const ADMIN_SESSION_KEY = 'birthday-word-search-admin';

const getConfiguredPasscode = () =>
  import.meta.env.VITE_ADMIN_PASSCODE;

const getFriendUrl = (token: string, gridCode: string) => {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams({ friend: token });
  const normalizedGridCode = normalizeGridCode(gridCode);

  if (normalizedGridCode !== DEFAULT_GRID_CODE) {
    params.set('grid', normalizedGridCode);
  }

  return `${baseUrl}?${params.toString()}`;
};

const getFriendTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('friend');
};

const cellKey = (cell: Cell) => `${cell.row}-${cell.col}`;
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

function AdminAnswers({ puzzles, theme }: AdminAnswersProps) {
  const [isUnlocked, setIsUnlocked] = useState(
    () => window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'unlocked',
  );
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(() => {
    const friendToken = getFriendTokenFromUrl();
    return puzzles.find((puzzle) => puzzle.accessToken === friendToken)?.id ?? '';
  });
  const [gridCode, setGridCode] = useState(getGridCodeFromUrl);

  const puzzleAnswers = useMemo(
    () =>
      puzzles.map((puzzle) => {
        const puzzleGridVariant = getPuzzleGridVariant(puzzle, gridCode);

        return {
          puzzle,
          generatedPuzzle: generateWordSearch(puzzleGridVariant),
        };
      }),
    [gridCode, puzzles],
  );
  const selectedPuzzleAnswer =
    puzzleAnswers.find(({ puzzle }) => puzzle.id === selectedPuzzleId);
  const solvedCellColors = useMemo(() => {
    const colors = new Map<string, string>();

    selectedPuzzleAnswer?.generatedPuzzle.placedWords.forEach((word, index) => {
      const color = ANSWER_COLORS[index % ANSWER_COLORS.length];
      word.cells.forEach((cell) => colors.set(cellKey(cell), color));
    });

    return colors;
  }, [selectedPuzzleAnswer]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!getConfiguredPasscode()) {
      setError('Admin passcode is not configured.');
      return;
    }

    if (passcode === getConfiguredPasscode()) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'unlocked');
      setIsUnlocked(true);
      setError('');
      return;
    }

    setError('Incorrect admin passcode.');
  };

  const logout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsUnlocked(false);
    setPasscode('');
  };

  if (!isUnlocked) {
    return (
      <main className={styles.adminPage}>
        <div className={styles.loginTheme}>
          <ThemeToggle value={theme.themeMode} onChange={theme.setThemeMode} />
        </div>
        <section className={styles.loginPanel}>
          <p className={styles.eyebrow}>Admin</p>
          <h1>Answer Key</h1>
          <p>
            Enter the admin passcode to view all friend puzzle answers. This is
            a casual static-site gate, not real authentication.
          </p>

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <label>
              <span>Passcode</span>
              <input
                autoFocus
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
              />
            </label>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit">Unlock answers</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.adminPage}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1>Answer Key</h1>
          <p>Select one friend at a time and view the solved word-search grid.</p>
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle value={theme.themeMode} onChange={theme.setThemeMode} />
          <button type="button" onClick={logout}>
            Lock
          </button>
        </div>
      </header>

      <section className={styles.puzzlePanel}>
        <div className={styles.puzzleToolbar}>
          <label>
            <span>Friend puzzle</span>
            <select
              value={selectedPuzzleId}
              onChange={(event) => setSelectedPuzzleId(event.target.value)}
            >
              <option value="">Select a friend puzzle</option>
              {puzzleAnswers.map(({ puzzle }) => (
                <option key={puzzle.id} value={puzzle.id}>
                  {puzzle.friendName ?? puzzle.title}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.gridCodeField}>
            <span>Grid code</span>
            <input
              value={gridCode}
              onChange={(event) => setGridCode(event.target.value.toUpperCase())}
            />
          </label>

          {selectedPuzzleAnswer ? (
            <a href={getFriendUrl(selectedPuzzleAnswer.puzzle.accessToken, gridCode)}>
              Open friend link
            </a>
          ) : (
            <span className={styles.disabledAction}>Open friend link</span>
          )}
        </div>

        {!selectedPuzzleAnswer && (
          <div className={styles.emptyAdminState}>
            <h2>No puzzle selected</h2>
            <p>
              Choose a friend puzzle from the dropdown to view its solved grid.
              No answer key is shown by default.
            </p>
          </div>
        )}

        {selectedPuzzleAnswer && (
          <>
          <div className={styles.puzzleMeta}>
            <div>
              <span>Grid</span>
              <strong>
                {selectedPuzzleAnswer.puzzle.size} x {selectedPuzzleAnswer.puzzle.size}
              </strong>
            </div>
            <div>
              <span>Words</span>
              <strong>{selectedPuzzleAnswer.generatedPuzzle.placedWords.length}</strong>
            </div>
            <div>
              <span>Grid Code</span>
              <code>{normalizeGridCode(gridCode)}</code>
            </div>
            <div>
              <span>Token</span>
              <code>{selectedPuzzleAnswer.puzzle.accessToken}</code>
            </div>
          </div>

          <div className={styles.solvedLayout}>
            <div className={styles.solutionViewport}>
              <div
                className={styles.solutionGrid}
                style={{
                  gridTemplateColumns: `repeat(${selectedPuzzleAnswer.puzzle.size}, var(--admin-cell-size))`,
                }}
              >
                {selectedPuzzleAnswer.generatedPuzzle.grid.map((row, rowIndex) =>
                  row.map((letter, colIndex) => {
                    const answerColor = solvedCellColors.get(`${rowIndex}-${colIndex}`);

                    return (
                      <div
                        className={`${styles.solutionCell} ${
                          answerColor ? styles.answerCell : ''
                        }`}
                        style={
                          answerColor
                            ? ({ '--answer-color': answerColor } as React.CSSProperties)
                            : undefined
                        }
                        key={`${rowIndex}-${colIndex}`}
                      >
                        {letter}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>

            <aside className={styles.answerWords}>
              <h2>Answers</h2>
              <div className={styles.answerWordList}>
                {selectedPuzzleAnswer.generatedPuzzle.placedWords
                  .map((word, index) => ({
                    word,
                    color: ANSWER_COLORS[index % ANSWER_COLORS.length],
                  }))
                  .sort((a, b) => a.word.displayText.localeCompare(b.word.displayText))
                  .map(({ word, color }) => (
                    <span
                      key={word.id}
                      style={
                        {
                          '--answer-color': color,
                        } as React.CSSProperties
                      }
                    >
                      {word.displayText}
                    </span>
                  ))}
              </div>
            </aside>
          </div>
          </>
        )}
      </section>
    </main>
  );
}

export default AdminAnswers;
