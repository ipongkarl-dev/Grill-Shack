# Grill Shack Restaurant Management App - PRD

## Original Problem Statement
Build a working app from an Excel file (Grill_Shack_v29_cogs_linked.xlsx) with COGS calculator, Sales Performance Tracker, Stock Forecasting, and more. Transform the Excel into a usable app for restaurant owners with all formulas linked and dynamically related.

## User Persona
- **Primary User**: Restaurant/food truck owner operating at multiple markets in NZ
- **Business**: Grill Shack BBQ House (Est. 2000), operating at Grafton, Britomart, EventFinda, Victoria Park, and Long Bay markets
- **Goal**: Replace complex Excel with a clean, dark-themed web app for managing daily operations

## Core Requirements
- Dark theme professional dashboard (NZD currency)
- Single user (no authentication)
- All Excel formulas translated to dynamic calculations
- Historical data migrated from Excel

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Fonts**: Manrope (headings) + IBM Plex Sans (body)

## What's Been Implemented (Feb 2026)

### 1. Operations Dashboard
- KPI cards: Total Sales, Gross Profit, Avg COGS %, Total Sessions
- Monthly Sales Performance bar chart (sales + profit)
- Sales by Market donut chart
- Recent Sessions list with status badges
- Low Stock Alerts panel

### 2. Session Input
- Date picker with calendar component
- Market selection dropdown (5 markets)
- Product unit entry for all 10 items
- Cash/EFTPOS payment entry
- Real-time calculations: total units, calculated sales, variance, COGS, profit
- Status tracking: OK, Under-collected, Over-collected, Missing Payment

### 3. Products & COGS Calculator
- Full product table: price, food cost, packaging cost, total cost, COGS %, profit
- Add/Edit/Delete products via dialog
- Live COGS preview during editing
- Stock level tracking with low-stock warnings
- Color-coded COGS badges (green < 25%, amber 25-35%, red > 35%)

### 4. Sales Dashboard
- Tabs: Trends, Products, Sessions
- Area chart for monthly sales & profit trends
- Bar chart for units sold & COGS
- Product performance ranking table
- Full session history table

### 5. Stock Planner
- Market-specific or all-market stock planning
- Target revenue input for demand estimation
- Sales mix % based on historical data
- Current stock vs. estimated orders gap analysis
- Shopping list for items to buy/prep
- Stock alerts (LOW/OK)

### 6. Cash System
- Session-level cash reconciliation
- Cash/EFTPOS/Calculated/Collected/Variance columns
- Edit sessions to update payment info
- Status summary (OK vs issue count)

### 7. Profit Allocation Tool
- Adjustable allocation percentages (Owner Pay, Growth, Emergency, Buffer)
- GST rate configuration (default 15%)
- Weekly sales calculator with pie chart
- Transfer instructions for each account

### 8. Margin Watch
- Product profitability analysis with lifetime stats
- Horizontal bar charts: profit by product, COGS % by product
- Action recommendations: PUSH HARD, CHECK PRICE, PROMOTE, KEEP VISIBLE
- Action guide explaining each recommendation

### 9. Custom Branding
- Grill Shack BBQ House logo in sidebar and mobile header

## Migrated Data
- 10 Products with costs and prices
- 5 Markets with preset sales mix percentages
- 11 Historical sessions (Feb-Apr 2026)
- Allocation settings (30/20/10/40 split)

## Prioritized Backlog

### P0 (Critical) - Done
- [x] All 8 feature modules implemented
- [x] Data migration from Excel
- [x] Dynamic COGS calculations

### P1 (Important) - Remaining
- [ ] Export reports to PDF/CSV
- [ ] Inventory Tracker (granular stock movements with supplier info)
- [ ] Product Refill Cost Trends
- [ ] Cashflow/Savings Tracker (monthly targets vs actuals)

### P2 (Nice to Have) - Remaining
- [ ] Scale Planner (future growth planning)
- [ ] Multi-user support with roles
- [ ] Mobile-optimized session input
- [ ] Push notifications for low stock alerts
- [ ] Historical data comparison (week-over-week, month-over-month)
