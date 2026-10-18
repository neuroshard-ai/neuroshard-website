# neuroshard.com

The website for [NeuroShard](https://github.com/neuroshard-ai/neuroshard): a React/Vite app.

- **`/`**: the whole product on one page: what it is, how it works, joining in one command, a node
  check, the live network and an FAQ. It reads the read-only explorer API at `/assistant/`
  (`python -m neuroshard.assistant.explorer` in the main repo), which cross-checks the validators' RPCs
  and holds no keys. `/network` and `/join` redirect to its sections.
- **`/vision`, `/teams`, `/build`, `/protocol`**: longer background pages, linked from the footer.
- **`/baseline`, `/baseline/join`, `/chat`, `/ledger`, `/model`**: the earlier 0.4.0 testnet, kept as it was.

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
