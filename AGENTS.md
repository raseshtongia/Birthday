# AGENTS.md

## Repository Identity

- This repository is `Birthdays`, a frontend-only React/Vite/TypeScript birthday word-search app.
- The main deployed site is intended for GitHub Pages at `https://raseshtongia.github.io/Birthday/`.
- Do not treat this as the IET Placement Portal. If the shell opens elsewhere, move to `/Users/chiku/Desktop/iet_personal/Birthdays` before inspecting or editing.

## Current Product Scope

- Phase 1 is only the word-search game.
- No Spring Boot backend, database, login system, admin editor, or birthday website/media sections are implemented.
- Friend-specific puzzle data is maintained in `src/data/friendWordLists.ts`.
- For CSB, use `other_docs/csb_list.txt` as the source list of eventual CSB members.
- Friend URLs use `?friend=ACCESS_TOKEN`.
- Shuffled puzzle layouts use `?grid=GRID_CODE`.
- Admin answer key uses `?admin=1` and can reproduce a friend's exact grid when given the same friend token and grid code.
- The bare route `/` must not show any friend puzzle or puzzle picker.

## Security And Privacy

- This is a static frontend app. Friend tokens and the admin passcode gate are convenience barriers, not real security.
- Vite exposes `VITE_` environment variables in the browser bundle at build time.
- Do not commit `.env`, `.env.local`, `FRIEND_LINKS.local.md`, secrets, tokens, generated builds, or private exports.
- Do not add sensitive personal data to puzzle files.

## Implementation Guidelines

- Prefer existing React + TypeScript + CSS Modules patterns.
- Keep puzzle generation deterministic. The same puzzle seed plus the same grid code must produce the same grid.
- Keep friend access tokens stable. Generated friend tokens should depend on friend name only, not on word-list changes.
- Preserve existing URL behavior for `?friend=...`, `?admin=1`, and optional `?grid=...`.
- Do not fall back to the first puzzle on public/default routes.
- Keep the word list hidden from players until words are found.
- Keep player progress in `localStorage`; do not add persistence services unless explicitly requested.
- Keep UI controls compact so the grid remains the primary focus, especially on desktop.

## Verification

- For code changes, run `npm run lint` and `npm run build`.
- For docs-only changes, run `git diff --check`.
- For friend-link changes, run `npm run links` if the local ignored link file should be refreshed.
- If visual layout changes affect the grid, prefer checking at least one desktop and one mobile viewport.

## Documentation

- Start with `codex_docs/README.md`.
- Use `codex_docs/FILE_MAP.md` to understand which file owns which behavior.
- Use `codex_docs/OPERATIONS.md` for local launch, deployment, friend links, and admin usage.
- Use `codex_docs/HANDOVER_PROMPT.md` when starting a fresh Codex chat.
