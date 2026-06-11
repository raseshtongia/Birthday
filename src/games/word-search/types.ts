export type DirectionKey = 'E' | 'W' | 'S' | 'N' | 'SE' | 'SW' | 'NE' | 'NW';

export type Cell = {
  row: number;
  col: number;
};

export type PuzzleWordConfig = {
  text: string;
  directions?: DirectionKey[];
};

export type PuzzleTheme = {
  accent?: string;
  found?: string;
  selection?: string;
};

export type PuzzleConfig = {
  id: string;
  accessToken: string;
  title: string;
  friendName?: string;
  message?: string;
  size: 20 | 25 | 30 | 35 | 40 | 45 | 50;
  seed: string;
  allowedDirections: DirectionKey[];
  theme?: PuzzleTheme;
  words: PuzzleWordConfig[];
};

export type FriendWordList = {
  friendName: string;
  words: string[];
  message?: string;
  gridSize?: PuzzleConfig['size'];
  accessToken?: string;
  theme?: PuzzleTheme;
};

export type PlacedWord = {
  id: string;
  text: string;
  displayText: string;
  direction: DirectionKey;
  cells: Cell[];
};

export type GeneratedPuzzle = {
  grid: string[][];
  placedWords: PlacedWord[];
};
