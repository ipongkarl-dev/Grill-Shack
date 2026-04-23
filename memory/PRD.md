# Grill Shack Restaurant Management App - PRD

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + Recharts (27 pages, 14 extracted components)
- **Backend**: FastAPI (70+ endpoints, 20+ extracted helper functions)
- **Database**: MongoDB
- **Auth**: JWT with admin(owner)/user(staff) roles + password change

## Extracted Backend Helpers
summarize_sessions, aggregate_market_sales, build_session_financials, compute_weekly_metrics, compute_scale_projections, process_session_sales, determine_cash_status, _period_label, _calc_growth_series, _aggregate_month_market, _month_market_to_rows, _format_date_display, _accumulate_weekly, _format_week_row, _aggregate_market_txns, _create_auto_backup, _build_refill_product_trends, _finalize_refill_result

## Extracted Frontend Components
AllocationSettingsPanel, AllocationWidgets, CashWidgets, InventoryTable, MarginCharts, MarginTable, MarketModeWidgets (TransactionLog, OrderSummary), POTable, ProductSalesGrid, SalesWidgets, SessionSummaryPanel

## Code Quality Status
- XSS: printPO uses safe DOM APIs (no document.write)
- Secrets: all test files use os.environ.get() with fallbacks
- Hooks: eslint-disable with justification on module-level stable deps
- Python `is`: all are correct `is None`/`is not None` per PEP-8

## Test Results: 100% pass rate across iterations 7-12
## Auth: owner@grillshack.nz / GrillShack2026!

## Upcoming (Phase C): Sales Dashboard ranking, Market Comparison graphs, Allocation forecaster, Scale Planner flexible schedule, Refill Trends clickable history
## Upcoming (Phase D): Calendar, Alert bell, Cashflow streamline, Prep Checklist add product, Auto-Reorder email, Settings lock, Manual update
