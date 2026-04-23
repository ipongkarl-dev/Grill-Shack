# Grill Shack Restaurant Management App - PRD v3.1

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts (27 pages, 19 components)
- **Backend**: FastAPI (85+ endpoints, 30+ helpers)
- **Database**: MongoDB | **Auth**: JWT Admin/User + password change

## Market Mode Features (POS Counter)
- **Training Mode**: Products always clickable without session for staff practice
- **Live Session**: Start/End with green LIVE indicator, auto-backup on end
- **Pause/Idle**: Amber PAUSED indicator, Save & End locked, Resume to continue
- **Transaction Edit**: Edit qty, payment method, remove items per transaction
- **Transaction Delete**: Remove transactions with confirmation
- **Excel Export**: All transactions with date/time/market/payment in columns
- **CASH/EFTPOS buttons**: One-tap payment recording per order

## Test Results: 100% pass rate across iterations 7-15
## Auth: owner@grillshack.nz / GrillShack2026!

## Remaining Backlog
- Session Input cross-match with Market Mode
- Cash System reconciliation
- Auto-Reorder email to supplier
- Settings lock Data Management
- Prep Checklist "Add Product"
- Cashflow Tracker streamlining
- SQLite migration + Electron packaging
