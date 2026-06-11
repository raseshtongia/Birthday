import { useMemo, useState } from 'react';
import styles from './App.module.css';
import { puzzles } from './data/puzzles';
import WordSearchGame from './games/word-search/WordSearchGame';

const getTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('friend');
};

function App() {
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(() => {
    const token = getTokenFromUrl();
    return puzzles.find((puzzle) => puzzle.accessToken === token)?.id ?? puzzles[0].id;
  });

  const selectedPuzzle = useMemo(
    () => puzzles.find((puzzle) => puzzle.id === selectedPuzzleId) ?? puzzles[0],
    [selectedPuzzleId],
  );
  const token = getTokenFromUrl();
  const tokenPuzzle = useMemo(
    () => puzzles.find((puzzle) => puzzle.accessToken === token),
    [token],
  );
  const isFriendLink = Boolean(token);
  const visiblePuzzle = tokenPuzzle ?? selectedPuzzle;

  if (isFriendLink && !tokenPuzzle) {
    return (
      <main className={styles.app}>
        <section className={styles.notFound}>
          <p className={styles.eyebrow}>Private puzzle</p>
          <h1>This birthday hunt link is not valid.</h1>
          <p className={styles.subtitle}>
            Please check the link and try again. The friend token must match one
            of the puzzle files.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 1</p>
          <h1>Birthday Word Search</h1>
          <p className={styles.subtitle}>
            Drag across the grid and find the hidden words. The word list stays
            hidden until each answer is discovered.
          </p>
        </div>

        {!isFriendLink && (
          <label className={styles.picker}>
            <span>Puzzle</span>
            <select
              value={selectedPuzzleId}
              onChange={(event) => setSelectedPuzzleId(event.target.value)}
            >
              {puzzles.map((puzzle) => (
                <option key={puzzle.id} value={puzzle.id}>
                  {puzzle.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <WordSearchGame key={visiblePuzzle.id} puzzle={visiblePuzzle} />
    </main>
  );
}

export default App;
