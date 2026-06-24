# Contributing to Assistant Chawn

Thanks for taking the time to contribute. This guide covers everything specific to this repo's tooling.

## Getting Started

```bash
git clone https://github.com/openUwU/assistant-chawn.git
cd assistant-chawn
npm install
```

`npm install` runs `prepare`, which installs the Husky git hooks automatically.

## Development

```bash
npm run dev      # run with hot-reload (tsx watch)
npm run build    # type-check + compile to dist/
```

## Code Style

This repo uses [Biome](https://biomejs.dev/) for both linting and formatting — tabs, double quotes, 80-char line width. Don't hand-format; let the tooling do it.

```bash
npm run format     # format all files
npm run lint        # check for lint issues
npm run lint:fix    # auto-fix lint issues
```

`tsconfig.json` runs in `strict` mode with `noUnusedLocals`/`noUnusedParameters` — make sure `npm run build` passes before opening a PR.

## File Headers

Every `.ts`/`.js` source file must carry the project credit header:

```ts
/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */
```

This is enforced automatically — `lint-staged` runs `scripts/add-header.js` on every staged `.ts`/`.js` file at commit time and adds the header if it's missing. Do not remove or alter this header in files you edit.

## Commit Messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by `commitlint` on every commit (max header length: 100 chars).

Use the interactive helper instead of writing commits by hand:

```bash
npm run commit
```

Example formats it produces:

```
fix(access): correct owner check for user-installed contexts
docs(readme): update environment variable table
```

Common types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`.

## Adding Commands or Events

- **Commands** go in `src/commands/` (subfolders allowed) and must default-export an object matching the `Command` type in `src/types/index.ts`.
- **Events** go in `src/events/` (flat directory) and must default-export a `BotEvent`.

Both are auto-discovered and loaded at startup — no manual registration needed.

## Pull Requests

1. Branch from `main`.
2. Keep PRs focused — one feature or fix per PR.
3. Make sure `npm run lint` and `npm run build` pass.
4. Use `npm run commit` for your commit messages.
5. Open the PR with a clear description of what changed and why.

For larger changes, open an issue first to discuss the approach before writing code.

## Credits

This project is maintained by [The OpenUwU Project](https://github.com/OpenUwU). Do not remove or modify project credits in source files or documentation.
