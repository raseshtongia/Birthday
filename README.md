# Birthdays

Phase 1 is a frontend-only birthday word search game. It uses React, Vite,
TypeScript, CSS Modules, and JSON puzzle files.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Open the local URL printed by Vite. It is usually:

```text
http://127.0.0.1:5173/
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Open the preview URL printed by Vite. It is usually:

```text
http://127.0.0.1:4173/
```

## Sharing With Friends

For local development, the app only runs on your machine. To share a link with a
friend, deploy it somewhere public.

The simplest option for this frontend-only app is GitHub Pages. No backend or
database is required for Phase 1.

### Deploy With GitHub Pages

1. Make sure the repo exists on GitHub.

2. Commit and push your latest code:

```bash
git add .
git commit -m "Add word search game"
git push -u origin main
```

3. In GitHub, open your repository.

4. Go to `Settings` -> `Pages`.

5. Under `Build and deployment`, set `Source` to `GitHub Actions`.

6. Go to the `Actions` tab.

7. Open the `Deploy to GitHub Pages` workflow and wait for it to finish.

8. After it succeeds, your app will be available at:

```text
https://YOUR_GITHUB_USERNAME.github.io/Birthdays/
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username. If you rename the
repository, replace `Birthdays` with the repository name.

### Updating The Shared App

After making changes:

```bash
git add .
git commit -m "Update puzzles"
git push
```

GitHub Actions will rebuild and redeploy the site automatically.

## Friend Word Lists

For normal use, edit only `src/data/friendWordLists.ts`. Add one object per
friend:

```ts
export const friendWordLists = [
  {
    friendName: 'Friend Name',
    message: 'A personal message shown at the top of the game.',
    words: [
      'FIRST WORD',
      'SECOND WORD',
      'THIRD WORD',
      'INSIDE JOKE',
      'FAVORITE SONG',
    ],
  },
];
```

The app automatically creates:

- puzzle title
- deterministic seed
- all 8 allowed directions
- hard-to-guess friend token
- recommended grid size
- puzzle picker entry

Run the app and test it:

```bash
npm run dev
```

### Optional Fields

Use these only when you want to override the defaults:

```ts
{
  friendName: 'Friend Name',
  accessToken: 'custom-long-secret-token',
  gridSize: 25,
  theme: {
    accent: '#d1495b',
    found: '#2a9d8f',
    selection: '#f4a261',
  },
  words: ['FIRST WORD', 'SECOND WORD'],
}
```

### Grid Size Rule Of Thumb

If you do not provide `gridSize`, the app chooses one automatically.

Recommended manual guide:

- `20 x 20`: up to about 18 words, longest word up to 20 letters
- `25 x 25`: up to about 30 words, longest word up to 25 letters
- `30 x 30`: up to about 42 words, longest word up to 30 letters
- `35 x 35`: up to about 55 words, longest word up to 35 letters
- `40 x 40`: up to about 70 words, longest word up to 40 letters
- `45 x 45`: up to about 85 words, longest word up to 45 letters
- `50 x 50`: larger lists or words up to 50 letters

This is a comfort rule, not a hard math rule. Longer words and dense word lists
need bigger grids. The generator also prefers overlapping placements when
letters match, including overlaps at starting cells when possible.

### Friend Links

Each friend can open their puzzle using the `accessToken`:

```text
https://YOUR_DOMAIN/?friend=make-this-long-random-and-hard-to-guess
```

For local testing:

```text
http://127.0.0.1:5173/?friend=make-this-long-random-and-hard-to-guess
```

This is useful for Phase 1, but it is not real security. Since this is a static
frontend app, puzzle data is still included in the deployed JavaScript bundle.
For true access control, use login plus a backend/database in a later phase.

### Progress

Progress is saved in the player's browser with `localStorage`.

That means:

- refreshing the page keeps found words highlighted
- closing and reopening the same browser keeps progress
- switching browsers or devices does not sync progress
- clearing browser storage resets progress

For cross-device progress, use an online database in a later phase.

### Hidden Word List

The app does not show the full list of words. It shows only:

- total words found
- progress percentage
- words after they have been correctly selected

Correct words remain highlighted on the board.

## Project Structure

```text
Birthdays/
├── src/
│   ├── data/puzzles/
│   └── games/word-search/
├── README.md
└── package.json
```

## Vercel Hosting

Vercel is a hosting/deployment platform for frontend and full-stack web apps. It
connects to your GitHub repo, builds the app, and gives you a public URL. Vercel
supports Vite apps directly.

### Deploy To Vercel

1. Push this repo to GitHub.

2. Go to:

```text
https://vercel.com/new
```

3. Import the `Birthdays` GitHub repository.

4. Select the Vite framework preset if Vercel does not detect it automatically.

5. Use these settings:

```text
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

6. Click `Deploy`.

7. Vercel will give you a URL like:

```text
https://birthdays-yourname.vercel.app
```

8. Share a friend-specific link:

```text
https://birthdays-yourname.vercel.app/?friend=FRIEND_ACCESS_TOKEN
```

After setup, pushing to the production branch, usually `main`, triggers a new
deployment automatically.

## Database Recommendation For Later

For fewer than 100 users, do not store credentials in files. Use an online
database/auth service.

Good next-step options:

- Supabase Auth + Supabase Postgres: easiest for login, friend records, and
  progress sync without writing a full backend immediately.
- Spring Boot + Postgres: best if you want to stay fully in your familiar
  React/Spring stack and own the API layer.

Recommended path:

1. Keep Phase 1 static with JSON files and `localStorage`.
2. Add Supabase or Spring Boot only when you need real login, private puzzles,
   admin editing, or synced progress.
