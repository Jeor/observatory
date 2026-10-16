# Development

Requires Node 24+:

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run demo
```

Open http://localhost:8080. For frontend development, leave the API running and run `npm run dev` in another terminal.

For native live mode, put the settings from the [connection guide](setup.md) in `.env.local`. Set `AIOM_ADMIN_KEY_FILE`, `AIOM_CONFIG_ID_FILE`, `STREAMS_CREDENTIALS_FILE`, and `OBSERVATORY_AUTH_FILE` to local file paths. Start with:

```sh
node --env-file=.env.local server/main.ts
```

Optional settings: `HOST` (default `127.0.0.1`), `PORT` (`8080`), and `DATA_DIR` (`./data`). Network-facing live mode requires a dashboard login. Keep credentials and data out of Git.

## Checks

```sh
npm test
npm run build
node scripts/smoke.mjs
docker build -t observatory:test .
sh scripts/container-smoke.sh observatory:test
```

GitHub Actions runs verification on pushes and pull requests. Version tags build, test, and publish AMD64/ARM64 images to GHCR. `npm run release:prepare` creates a source package containing only public files.
