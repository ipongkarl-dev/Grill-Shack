# Grill Shack Restaurant Management App - PRD v3.2

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts (27 pages, 21 components)
- **Backend**: FastAPI (90+ endpoints, 35+ helpers)
- **Database**: MongoDB | **Auth**: JWT Admin/User + password change

## Code Quality Status
- **Critical fixed**: undefined `i` in update_transaction → now uses `updated_txn`
- **XSS**: printPO uses safe DOM APIs only
- **Secrets**: all test files use os.environ.get()
- **Hooks**: ScalePlanner fetchPlan in useCallback with [targetRevenue, weeksHorizon]
- **Components**: MarketMode split via TransactionWidgets.jsx (472→391 lines), App.js split via AppSidebar.jsx
- **Constants**: BAR_RADIUS_TOP, FORECAST_PERIODS, SCHEDULE_DAYS extracted from inline arrays
- **Performance**: MarketComparison reduce memoized to `earliestDate`

## Test Results: 100% pass rate across iterations 7-16
## Auth: owner@grillshack.nz / GrillShack2026!

## Remaining Backlog
- Session Input cross-match with Market Mode, Cash System reconciliation
- Auto-Reorder email, Settings lock Data Management, Prep Checklist Add Product
- Cashflow Tracker streamlining, SQLite + Electron packaging
