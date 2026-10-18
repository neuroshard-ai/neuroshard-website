# neuroshard.com

The website for [NeuroShard](https://github.com/neuroshard-ai/neuroshard): a React/Vite app.

- **`/network`** — the live assistant network: status, how it works, one-command join, a key lookup,
  the live ledger, an FAQ, the roadmap, and what works and what doesn't yet. It reads the read-only
  explorer API at `/assistant/` (`python -m neuroshard.assistant.explorer` in the main repo), which
  cross-checks several validators' RPCs and holds no keys.
- **`/`** — the vision.
- **`/baseline`, `/baseline/join`, `/chat`, `/ledger`, `/model`** — the earlier 0.4.0 testnet, kept as is.

## Develop

Node 20+:

```bash
npm ci
npm run dev        # proxies /assistant to 127.0.0.1:39670 and the 0.4.0 gateway to 127.0.0.1:39659
npm run build      # type-checks, then writes dist/
npx playwright install chromium && npx playwright test
```

Set `NEUROSHARD_EXPLORER_URL` to point the dev server at another explorer. The tests use fixtures and need
no network.

## Deploy

`scripts/deploy.sh` builds and publishes to `/var/www/neuroshard/releases/<stamp>`. It copies the previous
release, replaces its `site/` with the build, and swaps the `current` symlink atomically. The previous
release stays available for rollback: `sudo ln -sfn <previous> /var/www/neuroshard/current`.

The nginx configuration this site expects is in `deploy/native-site.nginx.conf`.
