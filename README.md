![Header](https://raw.githubusercontent.com/OpenUwU/.github/refs/heads/main/header.jpg)

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/discord.js-5865F2.svg?style=for-the-badge&logo=discorddotjs&logoColor=white" alt="discord.js"/>
  <img src="https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Biome-60A5FA.svg?style=for-the-badge&logo=biome&logoColor=white" alt="Biome"/>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/openUwU/assistant-chawn?style=for-the-badge" alt="Stars"/>
  <img src="https://img.shields.io/github/issues/openUwU/assistant-chawn?style=for-the-badge" alt="Issues"/>
</p>

# Assistant Chawn

A lightweight, Discord bot built with discord.js and TypeScript. Designed to run as a personal/utility install (works in servers, DMs, and group chats via Discord's user-install) .

## Features

- **User-installable** — works in guilds, DMs, and group DMs via Discord's user-app integration.
- **Owner & access control** — owner-only commands, plus an optional restrictive mode where the owner grants/revokes per-user access (`/allow`).

## Tech Stack

- **[discord.js](https://discord.js.org/)** — Discord API library
- **TypeScript** (compiled with `tsc`, dev via `tsx watch`)
- **[Biome](https://biomejs.dev/)** — linting & formatting
- **Husky + lint-staged + commitlint + commitizen** — git hooks and conventional commits

## Prerequisites

- Node.js `>=18.17.0`
- A Discord bot application/token ([create one](https://discord.com/developers/applications))

## Setup

```bash
git clone https://github.com/openUwU/assistant-chawn.git
cd assistant-chawn
npm install
```

Create a `.env` file in the project root:

```env
DISCORD_TOKEN=
CLIENT_ID=
OWNER_IDS=

# Optional
RESTRICTIVE_MODE=false
BRAND_COLOR=
ERROR_COLOR=
DEBUG=false
NVIDIA_API_KEY=
GROQ_API_KEY=
```

| Variable            | Description                                       | Required |
|----------------------|----------------------------------------------------|----------|
| `DISCORD_TOKEN`      | Discord bot token                                  | Yes      |
| `CLIENT_ID`          | Discord application client ID                      | Yes      |
| `OWNER_IDS`          | Comma-separated user IDs treated as bot owners      | Yes      |
| `RESTRICTIVE_MODE`   | When `true`, owner-managed access gates commands flagged `restrictive` | No |
| `BRAND_COLOR`        | Hex int used for default embed/container accent     | No       |
| `ERROR_COLOR`        | Hex int used for error embed/container accent        | No       |
| `DEBUG`              | When `true`, enables debug-level logs               | No       |
| `NVIDIA_API_KEY`     | API key for NVIDIA API (ai chats)                            | No       |
| `GROQ_API_KEY`       | API key for GROQ API (ai chats)                              | No       |

## Running

```bash
npm run dev     # hot-reload via tsx
npm run build   # compile to dist/
npm start        # run compiled output
```

## Access Control

When `RESTRICTIVE_MODE=true`, owners can manage who else may run commands flagged as `restrictive`:

```
/allow grant <user>
/allow revoke <user>
/allow list
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the commit convention, code style, and PR workflow.

## License

See [LICENSE](./LICENSE). Hosting a public instance of this bot without permission is prohibited. Do not remove or modify the project credits.

## Credits

Maintained by [The OpenUwU Project](https://github.com/OpenUwU), created by [bre4d777](https://github.com/bre4d777) and collaborators.

<p align="center">
  <a href="https://discord.gg/nEbRPnxWtT">Support Server</a>
</p>
