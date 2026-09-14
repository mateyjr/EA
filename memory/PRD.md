# Colecle System EAMS — PRD

## Original Problem
Build "Colecle System EAMS" — full Enterprise Architecture Management System across six mandatory domains (Business, Application, Data, Security, Integration, Technology). Editable brand (name + logo). Distinct color + icon per domain everywhere the domain/repository is referenced.

## Personas
- Chief / Enterprise Architect (admin)
- Domain Architects (Business, Application, Data, Security, Integration, Technology)
- Reviewers, Application/Process Owners, Auditors

## Implemented (2026-02)

### Iteration 1 — MVP
- **Auth**: JWT bcrypt login/logout/me, admin seeded (matey.willy@gmail.com / Colecle123!).
- **Brand**: `/api/brand` singleton; Admin → Brand Settings updates name/subtitle/logo/accent, propagates to sidebar/topbar/login.
- **Six domain repositories**: unified `/api/objects` CRUD; each rendered with distinct color+icon (amber/Briefcase, blue/AppWindow, emerald/Database, red/Shield, violet/Network, slate/Server).
- **Relationships + Traceability**: forward/reverse/both SVG graph, impact analysis grouped by domain.
- **Governance**: Reviews (7-stage workflow), auto-numbered ADRs, Standards, Risks.
- **Dashboard**: 6 domain KPI cards + 8 KPI tiles + traceability model banner.
- **Architecture Map** + **Global Search** across objects/ADRs/standards/risks.
- **Seed data**: 27 objects + 32 relationships (Instant Payment Processing scenario).

### Iteration 2 — Advanced Features
- **Document Uploads**: `/api/objects/{id}/documents` multipart upload (max 15MB), stored base64 in Mongo. Drag & drop UI in new "Documents" tab on every 360° object detail page. Download via signed token query param.
- **Reports Export**: `/api/reports/{kind}?format=csv|xlsx|pdf` — 10 reports (application-portfolio, technology-eol, business-capabilities, integration-catalogue, data-catalogue, security-controls, risks, adrs, standards, all-objects). PDF via reportlab, XLSX via openpyxl.
- **Business Process Visualization**: `/api/processes/{id}/flow` walks `has_step` relationships + 3-hop downstream to build layered matrix. Rendered as "Process Flow" tab on process objects — horizontal step ribbon + rows=domains × cols=steps color-coded grid.
- **Audit Trail Console**: `/api/audit` with filters (domain, action, user_email, free-text q). UI at `/admin/audit` groups events by day, shows action icons (Created/Updated/Deleted/Doc-uploaded) colored per action, per-row Diff expander showing before/after JSON.

## Backlog
- P1: LDAP/AD integration + full RBAC roles per PDF spec.
- P1: File attachments via object storage (S3) instead of Mongo base64 for scale.
- P2: Business Capability heatmap (maturity × strategic importance).
- P2: DR Coverage report + RTO/RPO SLA dashboard.
- P2: React Flow-based Architecture Map with pan/zoom.

## Tech
- Backend: FastAPI + Motor + MongoDB, PyJWT, bcrypt, openpyxl, reportlab.
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + lucide-react + sonner. Fonts: Outfit + Plus Jakarta Sans + JetBrains Mono. Dark theme.
