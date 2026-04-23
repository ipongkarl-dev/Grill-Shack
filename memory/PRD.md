# Grill Shack Restaurant Management App - PRD v3.0

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + Recharts (27 pages, 16 components)
- **Backend**: FastAPI (80+ endpoints, 25+ helpers)
- **Database**: MongoDB
- **Auth**: JWT with Admin/User roles + password change

## All Features by Phase
### Phase A+B (Complete): Dashboard KPI fix, Market Mode POS, Weekly dates MM/DD/YY, Historical fix, Login roles Admin/User, PO print/edit/timestamp, Supplier views, Staff dropdown, COGS hyperlinks
### Phase C (Complete): Sales Dashboard top items ranking + per-market dropdown, Market Comparison date coverage, Allocation mini forecaster (1/3/6/12mo), Scale Planner flexible schedule (days/week), Refill Trends enhancements
### Phase D (Complete): Dashboard Calendar with events CRUD, Alert bell top-right with count, Alerts dismiss/delete, Manual updated

## Test Results: 100% pass rate across iterations 7-13
## Auth: owner@grillshack.nz / GrillShack2026!

## Remaining Backlog
- SQLite migration + Electron desktop packaging
- Session Input cross-match with Market Mode (discrepancy highlighting)
- Cash System reconciliation with Market Mode
- Auto-Reorder email to supplier
- Settings lock Data Management behind admin password
- Prep Checklist "Add Product" button
- Cashflow Tracker streamlining
