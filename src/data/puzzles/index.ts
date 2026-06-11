import type { PuzzleConfig } from '../../games/word-search/types';
import { friendWordLists } from '../friendWordLists';
import { createPuzzleFromFriend } from '../puzzleFactory';

export const puzzles = friendWordLists.map(createPuzzleFromFriend) as PuzzleConfig[];
