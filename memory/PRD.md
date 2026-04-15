# Grill Shack Restaurant Management App - PRD

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + Recharts (26 pages, 10 extracted components)
- **Backend**: FastAPI (60+ endpoints, helper functions extracted for maintainability)
- **Database**: MongoDB
- **Auth**: JWT with owner/staff roles + password change

## All 26 Implemented Pages
### Operations (5): Dashboard (Net Profit), Quick Mode, Session Input, Prep Checklist, Alerts
### Products (3): Products/COGS, Product Calculator, Margin Watch
### Sales & Analytics (4): Sales Dashboard (Excel exports), Weekly Control, Market Comparison, Historical (Month/Week labels)
### Inventory (4): Stock Planner, Inventory Tracker (Excel export), Refill Trends, Auto-Reorder (PO generation)
### Financial (4): Cash System, Allocation Tool, Cashflow Tracker (Excel export), Scale Planner
### People & Config (5): Staff Performance, Supplier Directory, Markets (Preset Copy), Data Repository (snapshots/backup), Settings (password change)
### Help (1): Manual / Walkthrough

## Extracted Components
AllocationSettingsPanel, AllocationWidgets, CashWidgets, InventoryTable, MarginCharts, MarginTable, ProductSalesGrid, SalesWidgets, SessionSummaryPanel

## Extracted Backend Helpers
summarize_sessions, aggregate_market_sales, build_session_financials, compute_weekly_metrics, compute_scale_projections, process_session_sales, determine_cash_status, _period_label, _calc_growth_series, _aggregate_month_market, _month_market_to_rows, calc_sales_mix, build_checklist_items, accumulate_staff_session, aggregate_by_period

## Code Quality
- All useCallback hooks have eslint-disable with justification (module-level imports + stable setters)
- No hardcoded secrets in test files (environment variables with fallbacks)
- `is None` / `is not None` used correctly per PEP-8
- ManualPage uses stable string-based keys
- filter/map chains memoized in MarketsPage and RefillTrends
- Backend functions under complexity thresholds via helper extraction

## Test Results: 100% pass rate across iterations 7-10
## Auth: owner@grillshack.nz / GrillShack2026!

## Upcoming (Phase 2)
- SQLite migration (replace MongoDB)
- Electron/Tauri desktop packaging
- Local login simplified auth
- Excel import fallback
