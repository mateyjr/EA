# Colecle System EAMS — PRD

## Original Problem
Enterprise Architecture Management System for "Colecle" across six mandatory domains with end-to-end traceability, editable brand, and distinct color+icon per domain everywhere it appears.

## Implemented (2026-02)

### Iteration 1 — MVP
- JWT auth (admin seeded), editable brand, 6-domain CRUD repositories with distinct color+icon, relationships, forward/reverse traceability + impact analysis, governance suite (Reviews/ADRs/Standards/Risks), dashboard KPIs, Architecture Map, global search.
- Seed: 27 objects + 32 relationships (Payments scenario).

### Iteration 2 — Advanced
- Document uploads, Reports export (CSV/XLSX/PDF, 10 report types), Business Process visualisation (per-step domain touches grid), Audit Trail Console.

### Iteration 3 — Enterprise Features
- **Object Storage (Emergent)**: `_storage_put`/`_storage_get` via INTEGRATION_PROXY_URL. Files stored under `colecle-eams/objects/{oid}/{doc-id}.ext`. DB soft-delete flag. Upload limit raised to 200MB.
- **DR Coverage Dashboard** (`/dr-coverage`): reads `attributes.rto`/`rpo`/`dr_site`/`has_dr` on applications; groups Covered/Partial/Missing, highlights Critical-Missing.
- **Capability Heatmap** (`/capabilities/heatmap`): L1-L5 × Low/Med/High grid. Sweet Spot (L5-High) and Invest Now (L1-L2 High) callouts.
- **Scheduled Report Emails**: `/api/subscriptions` CRUD + `/api/cron/weekly-reports` endpoint with Bearer WEBHOOK_CRON_SECRET auth + idempotency via cron_runs. `.emergent/crons.yml` fires every Mon 08:00 UTC. Email uses Emergent-managed Resend (dry-run when EMERGENT_EMAIL_KEY absent, logs to console).
- **LDAP / Directory Sign-in**: `/api/auth/ldap` accepts `DOMAIN\user`, `user@corp`, or `user`; preview binds against local user shadow (matches localpart of email). Toggle on login page between Local and Corporate LDAP.

## Backlog
- P1: Wire EMERGENT_EMAIL_KEY for real weekly email delivery.
- P1: Real LDAP/AD via ldap3 client (needs corporate LDAPS server).
- P2: DR Coverage: CSV export + editable DR fields inline.
- P2: Capability heatmap drag-to-move maturity/strategic.

## Tech
- Backend: FastAPI + Motor + MongoDB, PyJWT, bcrypt, openpyxl, reportlab, httpx, requests. Emergent object storage + email proxy.
- Frontend: React 19 + Tailwind + shadcn/ui + lucide-react + sonner. Outfit + Plus Jakarta Sans + JetBrains Mono. Dark theme.

## Credentials
Admin: matey.willy@gmail.com / Colecle123! (matches LDAP username `matey.willy@colecle.corp`).
