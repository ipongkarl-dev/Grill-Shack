# Grill Shack Restaurant Management App - PRD v3.0

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts (27 pages, 18 components)
- **Backend**: FastAPI (80+ endpoints, 30+ extracted helpers)
- **Database**: MongoDB
- **Auth**: JWT with Admin/User roles + password change

## Code Quality
- App.js: 166 lines (from 328) — Sidebar extracted to AppSidebar.jsx
- XSS: printPO uses DOM APIs only (no innerHTML/document.write)
- Secrets: all test files use os.environ.get() with fallbacks
- Hooks: eslint-disable with justifications on stable deps
- Ternaries: all nested ternaries replaced with explicit conditionals
- Empty catch: all replaced with console.warn or toast
- Backend: 30+ extracted helper functions, all under complexity thresholds

## Test Results: 100% pass rate across iterations 7-14
## Auth: owner@grillshack.nz / GrillShack2026!

## Remaining Backlog
- Session Input cross-match with Market Mode (discrepancy highlighting)
- Cash System reconciliation with Market Mode
- Auto-Reorder email to supplier
- Settings lock Data Management behind admin password
- Prep Checklist "Add Product" button
- Cashflow Tracker streamlining
- SQLite migration + Electron desktop packaging
