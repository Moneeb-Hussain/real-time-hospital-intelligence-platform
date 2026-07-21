# Database for AegisOps AI screens

## Apply now
1. Supabase → SQL Editor
2. Paste & run: `supabase/schema.sql`
3. Table Editor should show patients PT-001…, resources ICU/ER/CCU/Ward, alerts, recommendations

## Tables (done in DB)

| Table | Used by screens |
|-------|-----------------|
| `patients` | Intake, Queue, KPIs, AI context |
| `resources` | Resource Overview, Departments, Doctors, Equipment, AI |
| `recommendations` | AI Recommendations cards, Approve/Reject |
| `audit_logs` | Activity Timeline |
| `alerts` | System Alerts |

## Seeded demo data (after SQL)

- Beds: ICU 10 (1 free), ER 20, CCU 8, Ward 40
- Doctors D-01…D-08, monitors, ventilators
- Waiting patients PT-001…PT-006
- 2 pending recommendations (REC-001, REC-002)
- Alerts + activity events

## Left (not DB — app work)

| Left | Who |
|------|-----|
| FE call Spec APIs instead of fixtures | FE |
| Wire Approve → `PATCH .../decision` | FE + BE |
| Dashboard KPIs/queue from live DB (not mock) | BE/FE |
| Intake form → `POST /api/patients` + evaluate | FE + BE |
| Charts 7-day history (optional; mock OK) | later |
| AI Copilot chat (optional) | later |
| Put `OPENAI_API_KEY` on Vercel | AI/ops |

**DB is ready for the screens. Next is FE/BE wiring.**
