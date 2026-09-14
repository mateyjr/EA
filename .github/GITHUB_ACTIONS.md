# GitHub Actions — Build & Push Only

The workflow at `.github/workflows/deploy.yml` **only builds and pushes** the
two Docker images to **GitHub Container Registry (GHCR)**. You pull them onto
your Docker host and run `docker compose up -d` yourself.

Set the following in **Settings → Secrets and variables → Actions**.

---

## Repository Variables  (public, non-sensitive)

Under the **Variables** tab.

| Name | Example | Purpose |
|---|---|---|
| `DOMAIN` | `boteams-test.bot.go.tz` | Baked into the React build as `REACT_APP_BACKEND_URL` at build-time |

That's it — one variable. Everything else lives in the `.env` file **on your Docker host**, not in GitHub.

## Repository Secrets

None required by the workflow itself. `GITHUB_TOKEN` (automatic) authenticates the push to GHCR.

If you make the images **private** (default for GHCR) you'll need a Personal Access Token on the host to pull them — see the deploy steps below.

---

## What the workflow produces

On every push to `main` (or manual **Run workflow**), it publishes:

| Image | Tag |
|---|---|
| `ghcr.io/<owner>/<repo>-backend` | `latest` and `<git-sha[:7]>` |
| `ghcr.io/<owner>/<repo>-frontend` | `latest` and `<git-sha[:7]>` |

Names are lowercased automatically (GHCR requirement).

---

## Deploy on your host (manual)

### 1. First-time setup

```bash
# Install docker + compose plugin (any Linux):
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out & back in

# Prep the deploy directory
sudo mkdir -p /opt/colecle-eams
sudo chown $USER /opt/colecle-eams
cd /opt/colecle-eams
```

### 2. Copy config files from the repo (or scp them from your laptop)

You need exactly three files next to your `.env`:

- `docker-compose.yml`
- `Caddyfile`
- `.env` (create it from `.env.deploy.example` — see next step)

Either check out the repo on the host:
```bash
git clone https://github.com/<owner>/<repo>.git .
```
…or `scp` just those files from your dev box.

### 3. Configure `.env`

```bash
cp .env.deploy.example .env
sed -i "s|REPLACE_WITH_openssl_rand_hex_32|$(openssl rand -hex 32)|" .env
sed -i "s|REPLACE_WITH_openssl_rand_hex_16|$(openssl rand -hex 16)|" .env
$EDITOR .env   # set DOMAIN, ACME_EMAIL, ADMIN_EMAIL, ADMIN_PASSWORD
```

### 4. Point the compose file at the pushed images

Add these lines at the bottom of your `.env`:

```env
BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:latest
FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:latest
```

Replace `<owner>` and `<repo>` with your GitHub org + repo, lowercased.

### 5. Log in to GHCR (only for private images)

```bash
# Generate a classic PAT at https://github.com/settings/tokens with `read:packages`
echo "<YOUR_PAT>" | docker login ghcr.io -u <github-username> --password-stdin
```

### 6. Pull & run

```bash
docker compose pull
docker compose up -d
docker compose logs -f caddy   # wait for "certificate obtained"
```

Visit **https://boteams-test.bot.go.tz** and sign in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

### 7. Upgrade

Every push to `main` republishes `:latest`. On the host:

```bash
docker compose pull
docker compose up -d
docker image prune -f
```

---

## `.env` fields reference

| Variable | Required | Example |
|---|:-:|---|
| `DOMAIN` | ✅ | `boteams-test.bot.go.tz` |
| `ACME_EMAIL` | ✅ | `admin@bot.go.tz` |
| `JWT_SECRET` | ✅ | 64-char hex |
| `WEBHOOK_CRON_SECRET` | ✅ | 32-char hex |
| `ADMIN_EMAIL` | ✅ | `matey.willy@gmail.com` |
| `ADMIN_PASSWORD` | ✅ | strong password |
| `DB_NAME` |  | `colecle_eams` (default) |
| `EMAIL_FROM_NAME` |  | `Colecle EAMS` |
| `EMERGENT_EMAIL_KEY` |  | leave blank for DRY-RUN email |
| `BACKEND_IMAGE` | ✅ | `ghcr.io/<owner>/<repo>-backend:latest` |
| `FRONTEND_IMAGE` | ✅ | `ghcr.io/<owner>/<repo>-frontend:latest` |

---

## Trigger the workflow

- **Automatic**: push to `main`
- **Manual**: Actions tab → *Build & Push Colecle EAMS* → **Run workflow**
