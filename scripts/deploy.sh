#!/usr/bin/env bash
# Build and publish the site atomically, keeping the previous release for rollback.
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --no-audit --no-fund
npm run build
ROOT=/var/www/neuroshard
OLD=$(readlink -f "$ROOT/current")
NEW="$ROOT/releases/site-$(date -u +%Y%m%dT%H%M%S)"
sudo cp -a "$OLD" "$NEW"
sudo rsync -a --delete --exclude docs --exclude papers dist/ "$NEW/site/"
printf '{"published_at":"%s","source_commit":"%s","rollback":"%s"}\n' "$(date -u +%FT%TZ)" "$(git rev-parse HEAD)" "$OLD" \
  | sudo tee "$NEW/website-release.json" >/dev/null
sudo ln -sfn "$NEW" "$ROOT/current.next" && sudo mv -Tf "$ROOT/current.next" "$ROOT/current"
echo "published $NEW (rollback: $OLD)"
