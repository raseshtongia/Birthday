import type { PuzzleConfig } from '../../games/word-search/types';
import { friendWordLists } from '../friendWordLists';
import { createPuzzleFromFriend } from '../puzzleFactory';

export const puzzles = friendWordLists.map(createPuzzleFromFriend) as PuzzleConfig[];

const duplicateToken = puzzles.find(
  (puzzle, index) =>
    puzzles.findIndex((candidate) => candidate.accessToken === puzzle.accessToken) !== index,
);

if (duplicateToken) {
  throw new Error(
    `Duplicate friend link token "${duplicateToken.accessToken}". Add a custom accessToken for one of the friends.`,
  );
}
