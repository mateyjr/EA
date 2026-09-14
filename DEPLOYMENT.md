# Colecle EAMS · On-Prem Docker Deployment

Target host: any Linux box running Docker Engine 24+ and Docker Compose v2.
Target domain: **`boteams-test.bot.go.tz`** (change with the `DOMAIN` env var).

The stack ships as four containers behind Caddy (auto-TLS via Let's Encrypt):

```
Internet ──443──▶ Caddy ──▶ /api/* ─▶ FastAPI (uvicorn :8001) ─▶ MongoDB
                       │
                       └──▶ /*       ─▶ Nginx serving React build
                                          uploads on volume /data/uploads
```

Object storage falls back to **local filesystem** on-prem (persistent Docker
volume), and weekly report emails run via an **in-process APScheduler** so no
external cron service is needed.

---

## 1. DNS

Point `boteams-test.bot.go.tz` at the Docker host's public IP:

```
boteams-test.bot.go.tz.  A  <YOUR-HOST-PUBLIC-IP>
```

Verify with `dig +short boteams-test.bot.go.tz`.

## 2. Firewall

Open **80/tcp** and **443/tcp** to the world (Caddy needs HTTP-01 challenge on
:80 to obtain a certificate).

## 3. Configure

On the host:

```bash
git clone <this-repo> colecle-eams && cd colecle-eams
cp .env.deploy.example .env
# generate strong secrets:
sed -i "s|REPLACE_WITH_openssl_rand_hex_32|$(openssl rand -hex 32)|" .env
sed -i "s|REPLACE_WITH_openssl_rand_hex_16|$(openssl rand -hex 16)|" .env
# edit ADMIN_EMAIL / ADMIN_PASSWORD / ACME_EMAIL to taste
$EDITOR .env
```

## 4. Build & start

```bash
docker compose build
docker compose up -d
docker compose logs -f caddy    # watch for "certificate obtained successfully"
```

First boot takes 30-90 s while Caddy fetches the certificate. Then browse
[https://boteams-test.bot.go.tz](https://boteams-test.bot.go.tz).

## 5. First sign-in

- Local: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
- Corporate LDAP tab: same password with username `<localpart-of-admin-email>@colecle.corp`

Admin bootstrap is idempotent — restarting the stack never re-creates users but
does update the seeded admin's password if you change `ADMIN_PASSWORD`.

## 6. Backups

Two Docker volumes hold state:

| Volume | Contents | How to back up |
|---|---|---|
| `mongo_data` | All architecture objects, users, audit trail, ADRs, standards, risks, subscriptions | `docker exec colecle_mongo mongodump --archive --db $DB_NAME > backup.archive` |
| `uploads_data` | Document attachments | `docker run --rm -v colecle-eams_uploads_data:/src -v $PWD:/dst alpine tar czf /dst/uploads.tgz -C /src .` |

## 7. Common operations

```bash
docker compose ps                       # container status
docker compose logs -f backend          # backend logs
docker compose exec backend bash        # shell into backend
docker compose restart backend          # restart after config change
docker compose pull && docker compose up -d --build   # update
```

## 8. Environment reference

| Variable | Default | Purpose |
|---|---|---|
| `DOMAIN` | `boteams-test.bot.go.tz` | Public FQDN used by Caddy and injected as `REACT_APP_BACKEND_URL` at build time |
| `ACME_EMAIL` | `admin@bot.go.tz` | Let's Encrypt expiry notifications |
| `DB_NAME` | `colecle_eams` | MongoDB database name |
| `JWT_SECRET` | — (required) | Signs JWTs; rotate to force everyone out |
| `WEBHOOK_CRON_SECRET` | — (required) | Only needed if you call `/api/cron/weekly-reports` from an external scheduler |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed admin | Idempotently seeded on startup |
| `EMAIL_FROM_NAME` | `Colecle EAMS` | Display name on outbound emails |
| `EMERGENT_EMAIL_KEY` | *(empty)* | Set to enable real email; empty runs dry-run |
| `STORAGE_MODE` | `local` (compose default) | `local` = filesystem, `emergent` = Emergent proxy, `auto` = detect |
| `RUN_CRONS` | `true` (compose default) | Enables in-process APScheduler for weekly emails |

## 9. Sizing

Reference min-spec for ~50 architects:

- 2 vCPU
- 4 GB RAM
- 20 GB disk (Mongo + uploads)

## 10. HTTPS with an internal CA

If Let's Encrypt cannot reach the host (air-gapped), replace the `{$DOMAIN}`
block in `Caddyfile` with:

```caddy
{$DOMAIN} {
    tls /etc/caddy/certs/cert.pem /etc/caddy/certs/key.pem
    ...
}
```

and mount your cert & key into `/etc/caddy/certs`.

## 11. What is NOT in this on-prem build

- **Emergent object storage** — replaced by local FS on a Docker volume.
- **Emergent scheduled webhooks** — replaced by in-process APScheduler.
- **Emergent-managed Resend** — leave `EMERGENT_EMAIL_KEY` empty and the app
  runs email in dry-run (logs only). To enable real email delivery, either
  provision the key or replace `send_report_email` with an SMTP call using
  Python's `smtplib` (a 20-line change in `backend/server.py`).
- **Corporate LDAP** — the login toggle authenticates against the local user
  shadow. To bind against a real AD/LDAPS, add `ldap3` to `requirements.txt`
  and replace the body of `/api/auth/ldap` in `backend/server.py`.
