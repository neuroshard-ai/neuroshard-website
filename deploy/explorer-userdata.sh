#!/bin/bash
# User data for the neuroshard.com explorer origin: a small, single-purpose instance.
# - Runs the read-only network explorer (holds no keys, accepts only GET) behind nginx on port 80.
# - nginx serves /assistant/network, /assistant/jobs and /assistant/lookup only, validates the lookup key,
#   rate-limits per client, and refuses everything else. The security group admits port 80 from CloudFront only.
# - No SSH: the security group has no port 22. Manage it through AWS Systems Manager.
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -q && apt-get -y -q upgrade
apt-get install -y -q nginx git unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades
useradd --system --create-home --home-dir /var/lib/explorer --shell /usr/sbin/nologin explorer
sudo -u explorer bash -c '
  set -e; cd /var/lib/explorer
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH=$HOME/.local/bin:$PATH
  git clone -q --branch pilot-2 --depth 1 https://github.com/neuroshard-ai/neuroshard.git src
  uv python install 3.12.12
  uv venv -q -p 3.12.12 venv
  uv pip install -q --python venv/bin/python -r src/docs/assistant-runtime-2-requirements.txt
  uv pip install -q --python venv/bin/python --no-deps -e src'
cat > /etc/systemd/system/neuroshard-explorer.service <<'UNIT'
[Unit]
Description=NeuroShard read-only network explorer
After=network-online.target
Wants=network-online.target
[Service]
User=explorer
ExecStart=/var/lib/explorer/venv/bin/python -m neuroshard.assistant.explorer --host 127.0.0.1 --port 39670 --home /var/lib/explorer/home
Restart=on-failure
RestartSec=10
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/explorer
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_INET AF_INET6
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=false
CapabilityBoundingSet=
SystemCallArchitectures=native
MemoryMax=2G
[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/nginx/conf.d/explorer.conf <<'NGINX'
server_tokens off;
limit_req_zone $binary_remote_addr zone=explorer:10m rate=10r/s;
limit_req_status 429;
# CloudFront sends the viewer's address in X-Forwarded-For; rate-limit on it.
real_ip_header X-Forwarded-For;
set_real_ip_from 0.0.0.0/0;
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 1k;
    location = /assistant/network { limit_except GET { deny all; } limit_req zone=explorer burst=30 nodelay; proxy_pass http://127.0.0.1:39670; }
    location = /assistant/jobs    { limit_except GET { deny all; } limit_req zone=explorer burst=30 nodelay; proxy_pass http://127.0.0.1:39670; }
    location = /assistant/lookup  {
        limit_except GET { deny all; }
        limit_req zone=explorer burst=10 nodelay;
        # Public keys are 64-66 hex characters; anything else is refused before it reaches the explorer.
        if ($arg_key !~ "^[0-9a-fA-F]{64,66}$") { return 400; }
        proxy_pass http://127.0.0.1:39670;
    }
    location / { return 404; }
}
NGINX
rm -f /etc/nginx/sites-enabled/default
systemctl daemon-reload
systemctl enable --now neuroshard-explorer
nginx -t && systemctl enable --now nginx && systemctl reload nginx
