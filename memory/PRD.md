# Grill Shack Restaurant Management App - PRD

## Original Problem Statement
Build a working app from an Excel file (Grill_Shack_v29_cogs_linked.xlsx) with COGS calculator, Sales Performance Tracker, Stock Forecasting, and more. Transform the Excel into a usable app for restaurant owners with all formulas linked and dynamically related. Added: Market Day Quick Mode, Markets Management, Inventory Tracker, Cashflow Tracker, Product Calculator with ingredient-level COGS, and CSV Export.

## User Persona
- **Primary User**: Restaurant/food truck owner operating at multiple NZ markets
- **Business**: Grill Shack BBQ House (Est. 2000)
- **Markets**: Grafton, Britomart, EventFinda, Victoria Park, Long Bay + ability to add more

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Fonts**: Manrope (headings) + IBM Plex Sans (body)

## What's Been Implemented

### Phase 1 (MVP) - Completed
1. Operations Dashboard - KPI cards, charts, recent sessions, stock alerts
2. Session Input - full sales entry with real-time COGS calculations
3. Products & COGS - product management with pricing and cost tracking
4. Sales Dashboard - monthly trends, product performance, export CSV
5. Stock Planner - demand forecasting based on target revenue
6. Cash System - session reconciliation with cash/EFTPOS tracking
7. Allocation Tool - profit distribution with adjustable percentages
8. Margin Watch - profitability analysis with action recommendations

### Phase 2 (Feature Expansion) - Completed
9. Market Day Quick Mode - tap-to-count mobile-friendly rapid entry
10. Markets Management - full CRUD for market locations
11. Product Calculator - ingredient-level cost breakdown with auto COGS cascade
12. Inventory Tracker - stock movement log with supplier tracking
13. Cashflow Tracker - monthly targets vs actuals with savings goals
14. CSV Export - downloadable sessions and products reports

### Key Dynamic Features
- Price changes auto-update COGS %, profit, and margin watch
- Ingredient changes in Product Calculator auto-update product food_cost
- Session entries auto-deduct stock and update dashboard KPIs
- Cashflow actuals auto-populated from session sales data

## Migrated Data
- 10 Products, 5 Markets, 11 Historical Sessions, Allocation Settings

## Prioritized Backlog

### P1 (Important)
- [ ] Product Refill Cost Trends (historical cost tracking)
- [ ] Scale Planner (future growth planning with capital estimates)
- [ ] Weekly Control view (week-by-week financial summary)

### P2 (Nice to Have)
- [ ] Multi-user support with roles (owner, staff)
- [ ] Push notifications for low stock alerts
- [ ] Printing support for stock prep lists
- [ ] Historical data comparison (week-over-week, month-over-month)
