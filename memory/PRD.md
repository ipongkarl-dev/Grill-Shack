# Grill Shack Restaurant Management App - PRD

## Original Problem Statement
Build a working app from Excel file with COGS calculator, Sales Performance Tracker, Stock Forecasting. All formulas linked and dynamically related. Full flexibility to add markets, menu items, adjust pricing with auto COGS.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts (17 pages)
- **Backend**: FastAPI (27+ endpoints)
- **Database**: MongoDB

## What's Been Implemented

### Phase 1 - Core MVP
1. Operations Dashboard - KPIs, charts, alerts
2. Session Input - full sales entry with real-time COGS
3. Products & COGS - product CRUD with dynamic cost calculations
4. Sales Dashboard - trends, performance, CSV export
5. Stock Planner - demand forecasting
6. Cash System - reconciliation tracking
7. Allocation Tool - profit distribution
8. Margin Watch - profitability analysis

### Phase 2 - Dynamic Flexibility
9. Quick Mode - tap-to-count mobile rapid entry
10. Markets Management - full CRUD for markets
11. Product Calculator - ingredient-level COGS breakdown
12. Inventory Tracker - stock movements with supplier info
13. Cashflow Tracker - monthly targets vs actuals

### Phase 3 - Strategic Analytics
14. Market Comparison - side-by-side ranking with radar chart
15. Weekly Control - week-by-week financial breakdown
16. Refill Cost Trends - supplier cost history tracking
17. Scale Planner - growth projection with capital requirements

## Test Results
- Backend: 27/27 (100%)
- Frontend: All 17 pages functional (100%)

## Remaining Backlog (P2)
- [ ] Multi-user with roles
- [ ] Push notifications for stock alerts
- [ ] Print-friendly stock prep lists
- [ ] Historical comparison (WoW, MoM)
