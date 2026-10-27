# neuroshard.com on CloudFront

**Layout:**
- **Static site:** a private S3 bucket (`neuroshard-website-633665787904`: public access blocked, encrypted,
  versioned), reachable only by CloudFront through Origin Access Control.
- **Live-network API** (`/assistant/*`): the read-only explorer on its own small instance,
  `neuroshard-explorer-origin` (t3.small).
  - Its security group admits port 80 **from CloudFront only** (the managed prefix list `pl-3b927c52`), and SSH from
    the admin host only.
  - nginx serves just three GET endpoints, validates the lookup key and rate-limits per viewer.
  - The explorer runs as an unprivileged, sandboxed systemd user. IMDSv2 is required, and the disk is encrypted.
- **CloudFront:** HTTPS only, TLS 1.2+, HTTP/2 and 3, the same security headers the tests enforce, an SPA rewrite,
  `/join.sh` pinned to the release tag, and AWS WAF (managed common, known-bad-inputs and IP-reputation rules, plus a
  per-IP rate limit). The template is `cloudfront.yaml`.

**What an administrator with CloudFront, ACM, WAF and Route 53 rights does once:**
1. Request an ACM certificate in us-east-1 for `neuroshard.com` and `www.neuroshard.com`, validated by DNS.
2. Deploy the stack:
   ```bash
   aws cloudformation deploy --region us-east-1 --stack-name neuroshard-website --template-file deploy/cloudfront.yaml \
     --parameter-overrides CertificateArn=<arn> HostedZoneId=<zone> ExplorerOriginDomain=<explorer public DNS>
   ```
   The stack points the apex and `www` A/AAAA records at CloudFront. Until then the current server keeps serving.
3. Check `https://neuroshard.com` and `/help` and the live status, then retire the site from the old host.

**Publishing a new version:** run `npm run build`, then `scripts/publish-s3.sh`, then a CloudFront invalidation of `/index.html`.
