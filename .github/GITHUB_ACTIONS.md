# GitHub Actions Secrets & Variables

The workflow at `.github/workflows/deploy.yml` builds the two Docker images,
pushes them to **GitHub Container Registry (GHCR)**, and SSHes into your
on-prem host at `boteams-test.bot.go.tz` to run `docker compose up -d`.

Set the following in **Settings → Secrets and variables → Actions**.

---

## Repository Variables  (public, non-sensitive)

Under the **Variables** tab.

| Name | Example | Purpose |
|---|---|---|
| `DOMAIN` | `boteams-test.bot.go.tz` | Baked into React build as `REACT_APP_BACKEND_URL` and used by Caddy for auto-TLS |
| `ACME_EMAIL` | `admin@bot.go.tz` | Let's Encrypt expiry notifications |
| `DEPLOY_DIR` | `/opt/colecle-eams` | Host directory where `docker-compose.yml`, `Caddyfile`, `.env` land (default `/opt/colecle-eams`) |
| `DB_NAME` | `colecle_eams` | Mongo database name (default `colecle_eams`) |
| `EMAIL_FROM_NAME` | `Colecle EAMS` | Display name on outbound weekly digests |

## Repository Secrets  (sensitive)

Under the **Secrets** tab.

### SSH access to the Docker host

| Name | Example / How to obtain |
|---|---|
| `SSH_HOST` | Public IP or FQDN of your Docker host (e.g. `boteams-test.bot.go.tz`) |
| `SSH_USER` | Username on the host with Docker access (e.g. `deploy`) |
| `SSH_PRIVATE_KEY` | Full contents of a **private** SSH key whose **public key** is in `~/.ssh/authorized_keys` on the host. Generate with `ssh-keygen -t ed25519 -f colecle_deploy -C github-actions` and paste the file starting `-----BEGIN OPENSSH PRIVATE KEY-----` |
| `SSH_PORT` | *(optional)* Non-default SSH port. Omit for 22 |

### GHCR pull credentials (used on the host to `docker pull` private images)

| Name | How to obtain |
|---|---|
| `GHCR_READ_USER` | Your GitHub username (or a machine user) |
| `GHCR_READ_TOKEN` | A GitHub **Personal Access Token (classic)** with `read:packages`. Generate at [github.com/settings/tokens](https://github.com/settings/tokens). If you make the packages public, you can leave this blank and remove the `docker login` line from the workflow |

### Application runtime secrets (written into `.env` on the host)

| Name | Example / How to generate |
|---|---|
| `JWT_SECRET` | 64-char hex: `openssl rand -hex 32` |
| `WEBHOOK_CRON_SECRET` | 32-char hex: `openssl rand -hex 16` |
| `ADMIN_EMAIL` | `matey.willy@gmail.com` (seeded admin — idempotent) |
| `ADMIN_PASSWORD` | Strong password for the seeded admin. Rotate here and the next deploy re-hashes it |
| `EMERGENT_EMAIL_KEY` | Leave empty to keep weekly emails in **dry-run**; set to your Emergent email key (or wire SMTP in code) to enable real delivery |

---

## Environment protection (recommended)

Create a **Production** environment under Settings → Environments and:
- Require manual approval before the `deploy` job runs
- Restrict which branches (e.g. `main`) can deploy through it
- Move the SSH secrets into the Environment scope so they're only exposed on approved runs

The workflow already references `environment: production` on the deploy job — you only need to click **New environment** → name it `production`.

---

## First deployment prerequisites (one-time, on the host)

```bash
# As root or a user in the docker group:
sudo mkdir -p /opt/colecle-eams
sudo chown $USER /opt/colecle-eams

# Install docker engine + compose if not already
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out & back in

# Add the CI public key to authorized_keys for `deploy` user
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA... github-actions" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

DNS `boteams-test.bot.go.tz A <host-public-ip>` must resolve, and ports **80** and **443** must be reachable from the internet for Let's Encrypt to issue a certificate.

---

## Trigger

Push to `main`, or hit **Run workflow** manually from the Actions tab (workflow_dispatch is enabled).
