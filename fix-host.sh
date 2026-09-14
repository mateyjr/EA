#!/usr/bin/env bash
# Run this on the Docker host at /opt/colecle-eams (or wherever compose lives)
set -euo pipefail

# 1. Nuke the stray old Caddy container that's squatting on port 3003
docker rm -f colecle_caddy 2>/dev/null || true

# 2. Refresh compose file, nginx.conf, and .env.deploy.example from your repo.
#    (Assumes you already `git pull`ed the latest.)
ls -1 docker-compose.yml frontend/nginx.conf .env >/dev/null || {
  echo "ERROR: run this from your deploy dir (docker-compose.yml + .env must exist)"
  exit 1
}

# 3. Make sure .env has the image pins pointing at your GHCR
grep -q '^BACKEND_IMAGE=' .env  || echo 'BACKEND_IMAGE=ghcr.io/mateyjr/ea-backend:latest'  >> .env
grep -q '^FRONTEND_IMAGE=' .env || echo 'FRONTEND_IMAGE=ghcr.io/mateyjr/ea-frontend:latest' >> .env

# 4. Pull latest + restart the stack, removing any orphan containers (Caddy)
docker compose pull
docker compose up -d --remove-orphans

# 5. Confirm frontend is publishing 3003
docker compose ps
echo
curl -fsS http://127.0.0.1:3003/ >/dev/null && echo "✅  Frontend reachable on 127.0.0.1:3003"
curl -fsS http://127.0.0.1:3003/api/ && echo "  ← backend reachable via nginx /api"
