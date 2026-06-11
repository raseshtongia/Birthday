import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const sourceFile = path.join(repoRoot, 'src/data/friendWordLists.ts');
const outputFile = path.join(repoRoot, 'FRIEND_LINKS.local.md');
const defaultBaseUrl = 'https://raseshtongia.github.io/Birthday/';
const baseUrl = process.argv[2] ?? defaultBaseUrl;

const ACCESS_TOKEN_SALT = 'birthdays-word-search-v1';
const SUBSTITUTION_ALPHABET = 'Q8W7E6R5T4Y3U2I1O0PASDFGHJKLZXCVBNM9';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createSubstitutionCode = (friendName) => {
  const source = `${ACCESS_TOKEN_SALT}:${friendName}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const charCode = char.charCodeAt(0);
    const alphabetIndex =
      char >= 'A' && char <= 'Z'
        ? charCode - 65
        : 26 + Number(char);
    const substitutedChar = SUBSTITUTION_ALPHABET[alphabetIndex];

    hash ^= substitutedChar.charCodeAt(0) + index;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0)
    .toString(36)
    .toUpperCase()
    .padStart(6, '0')
    .slice(-6);
};

const createToken = (friend) =>
  friend.accessToken ?? `${slugify(friend.friendName)}-${createSubstitutionCode(friend.friendName)}`;

const normalizeBaseUrl = (value) => (value.endsWith('/') ? value : `${value}/`);

const loadFriendWordLists = async () => {
  const source = await fs.readFile(sourceFile, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
  const module = await import(dataUrl);

  return module.friendWordLists;
};

const friendWordLists = await loadFriendWordLists();
const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
const links = friendWordLists.map((friend) => {
  const token = createToken(friend);

  return {
    friendName: friend.friendName,
    token,
    url: `${normalizedBaseUrl}?friend=${encodeURIComponent(token)}`,
  };
});

const duplicateToken = links.find(
  (link, index) => links.findIndex((candidate) => candidate.token === link.token) !== index,
);

if (duplicateToken) {
  throw new Error(`Duplicate token generated: ${duplicateToken.token}`);
}

const content = [
  '# Friend Links',
  '',
  'This file is generated locally by `npm run links` and is ignored by git.',
  '',
  `Base URL: ${normalizedBaseUrl}`,
  '',
  '| Friend | Token | URL |',
  '| --- | --- | --- |',
  ...links.map(
    (link) => `| ${link.friendName} | \`${link.token}\` | ${link.url} |`,
  ),
  '',
].join('\n');

await fs.writeFile(outputFile, content);

console.log(`Generated ${path.relative(repoRoot, outputFile)}`);
links.forEach((link) => {
  console.log(`${link.friendName}: ${link.url}`);
});
