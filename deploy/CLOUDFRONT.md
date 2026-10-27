# neuroshard.com on CloudFront

**Live since 2026-10-27 03:57 UTC:**
- **Stack and distribution:** stack `neuroshard-website`, distribution `E1IY4JY0EHW1JY` (`d1orjvmh0xnmha.cloudfront.net`).
- **Certificate:** ACM `ce697bf4-5e03-4b28-9bf3-90176cb40f7d`, covering `neuroshard.com` and `www`, valid until May 2027;
  ACM renews it automatically.
- **DNS:** Route 53 zone `Z0091611COXPBJ08AVD0`; `neuroshard.com` and `www` have A and AAAA aliases to the distribution.
- **Explorer origin:** `i-013a38af40d8c8c80`.
- **WAF:** off (`EnableWaf=false`).
- **Not moved:** `docs.neuroshard.com` stays on its own server.


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
  `/join.sh` pinned to the release tag, and AWS Shield Standard DDoS protection (included). AWS WAF (managed
  rules plus a per-IP rate limit, about $9-10 a month) is optional: add `EnableWaf=true` to the parameters. The template is `cloudfront.yaml`.

**What an administrator with CloudFront, ACM, WAF and Route 53 rights does once:**
1. Request an ACM certificate in us-east-1 for `neuroshard.com` and `www.neuroshard.com`, and validate it by DNS
   (status **Issued**).
2. Deploy the stack. **It doesn't touch DNS**, so the live site keeps running:
   ```bash
   aws cloudformation deploy --region us-east-1 --stack-name neuroshard-website \
     --template-file deploy/cloudfront.yaml \
     --parameter-overrides CertificateArn=<certificate ARN> \
       ExplorerOriginDomain=ec2-18-232-160-200.compute-1.amazonaws.com
   ```
3. Test on the CloudFront domain the stack outputs (`DistributionDomain`).
4. Switch DNS: point `neuroshard.com` and `www.neuroshard.com` A and AAAA records at that domain, as aliases
   (zone `Z2FDTNDATAQYW2`). Then retire the site from the old host.

**Publishing a new version:** run `npm run build`, then `scripts/publish-s3.sh`, then a CloudFront invalidation of `/index.html`.
