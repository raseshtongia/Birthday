import { FormEvent, useMemo, useState } from 'react';
import styles from './AdminAnswers.module.css';
import { generateWordSearch } from '../games/word-search/generator';
import type { Cell, PuzzleConfig } from '../games/word-search/types';

type AdminAnswersProps = {
  puzzles: PuzzleConfig[];
};

const ADMIN_SESSION_KEY = 'birthday-word-search-admin';

const getConfiguredPasscode = () =>
  import.meta.env.VITE_ADMIN_PASSCODE;

const getFriendUrl = (token: string) => {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}?friend=${encodeURIComponent(token)}`;
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

function AdminAnswers({ puzzles }: AdminAnswersProps) {
  const [isUnlocked, setIsUnlocked] = useState(
    () => window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'unlocked',
  );
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(puzzles[0]?.id ?? '');

  const puzzleAnswers = useMemo(
    () =>
      puzzles.map((puzzle) => ({
        puzzle,
        generatedPuzzle: generateWordSearch(puzzle),
      })),
    [puzzles],
  );
  const selectedPuzzleAnswer =
    puzzleAnswers.find(({ puzzle }) => puzzle.id === selectedPuzzleId) ?? puzzleAnswers[0];
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
        <button type="button" onClick={logout}>
          Lock
        </button>
      </header>

      {selectedPuzzleAnswer && (
        <section className={styles.puzzlePanel}>
          <div className={styles.puzzleToolbar}>
            <label>
              <span>Friend puzzle</span>
              <select
                value={selectedPuzzleAnswer.puzzle.id}
                onChange={(event) => setSelectedPuzzleId(event.target.value)}
              >
                {puzzleAnswers.map(({ puzzle }) => (
                  <option key={puzzle.id} value={puzzle.id}>
                    {puzzle.friendName ?? puzzle.title}
                  </option>
                ))}
              </select>
            </label>

            <a href={getFriendUrl(selectedPuzzleAnswer.puzzle.accessToken)}>
              Open friend link
            </a>
          </div>

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
        </section>
      )}
    </main>
  );
}

export default AdminAnswers;
