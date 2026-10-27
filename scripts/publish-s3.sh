#!/usr/bin/env bash
# Build and publish the static site to the CloudFront origin bucket. Hashed assets are immutable; the rest no-cache.
set -euo pipefail
cd "$(dirname "$0")/.."
BUCKET=${BUCKET:-neuroshard-website-633665787904}
npm ci --no-audit --no-fund && npm run build
aws s3 sync dist/assets/ "s3://$BUCKET/assets/" --cache-control "public, max-age=31536000, immutable" --only-show-errors
aws s3 sync dist/ "s3://$BUCKET/" --delete --exclude "assets/*" --cache-control no-cache --only-show-errors
echo "published $(git rev-parse --short HEAD) to s3://$BUCKET"
[ -n "${DISTRIBUTION_ID:-}" ] && aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths /index.html / >/dev/null && echo invalidated || true
