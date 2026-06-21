# ourTab

ourTab is a self-hosted browser start-page app built with Nuxt 3, Vue 3, Pinia, SQLite, and Drizzle ORM.

## Features

- Search bar with Google, Bing, and DuckDuckGo defaults.
- Tab groups, folder tabs, responsive tab grid, and drag sorting.
- Settings for theme, language, search engine, background, and sidebar collapse.
- JSON import/export for groups, tabs, and settings.
- Docker deployment with a persistent SQLite database.

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Verification

```bash
pnpm test
pnpm build
```

## Environment Variables

- `DATABASE_PATH`: SQLite database file path. Local default is `./data/ourtab.db`; Docker default is `/app/data/ourtab.db`.
- `PORT`: server port. Docker exposes `3000`.

## Docker

```bash
cd docker
docker compose up -d
```

The Compose stack mounts `docker/data` to `/app/data` so the SQLite database survives container replacement.

## Import and Export

Use the Import and Export dialog in the app to download a JSON payload with `version`, `exportedAt`, `groups`, `tabs`, and `settings`, or upload a compatible payload to replace current data.
