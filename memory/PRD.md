# Colecle System EAMS — PRD

## Original Problem
Build "Colecle System EAMS" — a full Enterprise Architecture Management System across six mandatory domains (Business, Application, Data, Security, Integration, Technology). Editable brand (name + logo). Distinct color + icon per domain used everywhere that domain/repository is referenced.

## Personas
- Chief / Enterprise Architect (admin)
- Domain Architects (Business, Application, Data, Security, Integration, Technology)
- Reviewers, Application/Process Owners, Auditors

## Core Requirements (static)
1. Six domains, each with distinct color + unique icon appearing everywhere.
2. Editable brand: name, subtitle, logo, accent color propagated app-wide.
3. Relationship-driven data model → end-to-end traceability (forward + reverse) and impact analysis.
4. 360° detail per object.
5. Governance: Architecture Reviews (workflow), ADRs, Standards, Risks / Technical Debt.
6. Enterprise dashboard with domain KPIs + drill-down.
7. Enterprise Architecture Map.
8. Global search across all domains/artefacts.
9. JWT-based auth with RBAC (admin seeded).

## Implemented (2026-02)
- **Auth**: JWT bcrypt login/logout/me, admin seeded (matey.willy@gmail.com / Colecle123!).
- **Brand**: `GET/PUT /api/brand` singleton; sidebar + topbar + login page pull live from BrandContext; Admin → Brand Settings page with logo upload (data URI) + accent color presets.
- **Six domain repositories**: unified `/api/objects` CRUD with `domain` + `type` filters; each rendered with distinct color+icon (amber/Briefcase, blue/AppWindow, emerald/Database, red/Shield, violet/Network, slate/Server).
- **Relationships**: `/api/relationships` CRUD; add/remove from Object detail page.
- **Traceability**: SVG layered graph with forward / reverse / both directions, depth 5.
- **Impact analysis**: `/api/impact/{id}` groups affected objects by domain.
- **Governance**: `/api/reviews` with 7-stage workflow stepper, `/api/adrs` with numbered ADRs, `/api/standards`, `/api/risks`.
- **Dashboard**: 6 domain KPI cards + 8 KPI tiles + traceability model banner.
- **Architecture Map**: grouped visualisation across the six domains.
- **Global Search**: `/api/search?q=` searches objects/ADRs/standards/risks.
- **Seed data**: Payments (Instant Payment Processing) scenario with 27 objects and 32 relationships, demonstrating end-to-end traceability.

## Backlog / Next
- P1: LDAP/AD integration + full RBAC roles per PDF spec.
- P1: Report exports (PDF/Excel/CSV).
- P1: Document/file attachments on objects (object storage).
- P2: Audit trail UI (backend audit collection already writes).
- P2: Business process visualisation with per-step domain overlays.
- P2: Advanced filtering on Architecture Map + per-domain sub-dashboards.

## Tech
- Backend: FastAPI + Motor + MongoDB, PyJWT, bcrypt.
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + lucide-react + sonner. Fonts: Outfit + Plus Jakarta Sans + JetBrains Mono. Dark theme by default.
