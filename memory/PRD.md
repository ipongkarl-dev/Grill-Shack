# Grill Shack Restaurant Management App - PRD

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + Recharts (27 pages)
- **Backend**: FastAPI (70+ endpoints)
- **Database**: MongoDB
- **Auth**: JWT with admin(owner)/user(staff) roles + password change

## All 27 Implemented Pages
### Operations (5): Dashboard (Net Profit, 5 KPIs), Market Mode (POS Counter), Session Input, Prep Checklist, Alerts
### Products (3): Products/COGS, Product Calculator, Margin Watch
### Sales & Analytics (4): Sales Dashboard (Excel exports), Weekly Control (MM/DD/YY), Market Comparison, Historical (Month/Week labels, no future dates)
### Inventory (4): Stock Planner, Inventory Tracker (clickable COGS flow), Refill Trends, Auto-Reorder (PO print/edit/timestamp)
### Financial (4): Cash System, Allocation Tool, Cashflow Tracker (Excel export), Scale Planner
### People & Config (6): Staff Performance (per-staff dropdown), Supplier Directory (tile/grid/list views, email links), Markets (Preset Copy), Data Repository, Settings (password change), Manual

## Key Phase A+B Features
- Dashboard KPI icons fixed (inside box beside label)
- Weekly Control dates: MM/DD/YY + day name
- Login roles: Admin/User instead of Owner/Staff
- PO: printable (popup window), editable, timestamped
- Inventory COGS flow badges clickable with hyperlinks
- Supplier Directory: 3 view modes + email mailto links
- Staff Performance: per-staff dropdown filter
- Historical tab: no future dates, sorted oldest to latest
- Market Mode: full POS counter with session indicator, product buttons, CASH/EFTPOS payment, transaction log with timestamps, auto-backup

## Test Results: 100% pass rate (iterations 7-11)
## Auth: owner@grillshack.nz / GrillShack2026!

## Upcoming (Phase C)
- Sales Dashboard ranked items, per-market Top 3, avg summary
- Market Comparison date coverage, monthly graph
- Allocation Tool mini forecaster
- Scale Planner flexible schedule
- Refill Trends clickable history

## Upcoming (Phase D)
- Dashboard Calendar (interactive, notes, alarms)
- Alert notification bell (top-right)
- Cashflow Tracker streamlined
- Prep Checklist Add Product button
- Auto-Reorder email to supplier
- Settings lock Data Management
- Manual update
