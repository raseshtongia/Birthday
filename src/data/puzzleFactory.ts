import type {
  DirectionKey,
  FriendWordList,
  PuzzleConfig,
} from '../games/word-search/types';

const DIRECTIONS: DirectionKey[] = ['E', 'W', 'S', 'N', 'SE', 'SW', 'NE', 'NW'];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeWord = (word: string) =>
  word.toUpperCase().replace(/[^A-Z]/g, '');

const hashText = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const recommendGridSize = (words: string[]): PuzzleConfig['size'] => {
  const normalizedWords = words.map(normalizeWord).filter(Boolean);
  const wordCount = normalizedWords.length;
  const longestWord = Math.max(...normalizedWords.map((word) => word.length), 0);
  const totalLetters = normalizedWords.reduce((sum, word) => sum + word.length, 0);

  if (longestWord > 45 || wordCount > 85 || totalLetters > 820) {
    return 50;
  }

  if (longestWord > 40 || wordCount > 70 || totalLetters > 660) {
    return 45;
  }

  if (longestWord > 35 || wordCount > 55 || totalLetters > 520) {
    return 40;
  }

  if (longestWord > 30 || wordCount > 42 || totalLetters > 390) {
    return 35;
  }

  if (longestWord > 25 || wordCount > 30 || totalLetters > 270) {
    return 30;
  }

  if (longestWord > 20 || wordCount > 18 || totalLetters > 170) {
    return 25;
  }

  return 20;
};

export const createPuzzleFromFriend = (friend: FriendWordList): PuzzleConfig => {
  const id = slugify(friend.friendName);
  const seedInput = `${friend.friendName}:${friend.words.join('|')}`;
  const token = friend.accessToken ?? `${id}-${hashText(seedInput)}-${hashText(seedInput.split('').reverse().join(''))}`;

  return {
    id,
    accessToken: token,
    title: `${friend.friendName}'s Birthday Hunt`,
    friendName: friend.friendName,
    message: friend.message,
    size: friend.gridSize ?? recommendGridSize(friend.words),
    seed: seedInput,
    allowedDirections: DIRECTIONS,
    theme: friend.theme,
    words: friend.words.map((word) => ({ text: word })),
  };
};
