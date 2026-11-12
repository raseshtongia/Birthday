import { useMemo } from 'react';
import styles from './App.module.css';
import AdminAnswers from './admin/AdminAnswers';
import { puzzles } from './data/puzzles';
import WordSearchGame from './games/word-search/WordSearchGame';
import ThemeToggle from './theme/ThemeToggle';
import { useTheme } from './theme/useTheme';

const getTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('friend');
};

const isAdminUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('admin') === '1';
};

function App() {
  const theme = useTheme();

  if (isAdminUrl()) {
    return <AdminAnswers puzzles={puzzles} theme={theme} />;
  }

  return <FriendGameApp theme={theme} />;
}

type ThemeControls = ReturnType<typeof useTheme>;

function FriendGameApp({ theme }: { theme: ThemeControls }) {
  const token = getTokenFromUrl();
  const tokenPuzzle = useMemo(
    () => puzzles.find((puzzle) => puzzle.accessToken === token),
    [token],
  );
  const isFriendLink = Boolean(token);

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

  if (!tokenPuzzle) {
    return (
      <main className={styles.app}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Private puzzle</p>
            <h1>Birthday Word Search</h1>
            <p className={styles.subtitle}>
              This game opens from a private friend link. Ask for your birthday
              puzzle link to start playing.
            </p>
          </div>

          <div className={styles.headerActions}>
            <ThemeToggle value={theme.themeMode} onChange={theme.setThemeMode} />
          </div>
        </header>

        <section className={styles.defaultPage}>
          <h2>Ready when you have your link.</h2>
          <p>
            Friend puzzles are not shown on the default page. Use the exact link
            shared with you to open your game.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.app}>
      <WordSearchGame key={tokenPuzzle.id} puzzle={tokenPuzzle}
        headerActions={<ThemeToggle value={theme.themeMode} onChange={theme.setThemeMode} />} />
    </main>
  );
}

export default App;
