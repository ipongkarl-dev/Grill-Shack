# Grill Shack Restaurant Management App - PRD

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + Recharts (26 pages)
- **Backend**: FastAPI (60+ endpoints)
- **Database**: MongoDB
- **Auth**: JWT with owner/staff roles + password change

## All 26 Implemented Pages

### Operations (5)
1. Dashboard (with Net Profit), 2. Quick Mode, 3. Session Input, 4. Prep Checklist, 5. Alerts

### Products (3)
6. Products/COGS, 7. Product Calculator, 8. Margin Watch

### Sales & Analytics (4)
9. Sales Dashboard (with Excel exports), 10. Weekly Control, 11. Market Comparison, 12. Historical Comparison (with Month/Week labels)

### Inventory (4)
13. Stock Planner, 14. Inventory Tracker (with Excel export), 15. Refill Trends, 16. Auto-Reorder (PO generation)

### Financial (4)
17. Cash System, 18. Allocation Tool, 19. Cashflow Tracker (with Excel export), 20. Scale Planner

### People & Config (5)
21. Staff Performance, 22. Supplier Directory, 23. Markets (with Preset Copy), 24. Data Repository (snapshots/backup/restore), 25. Settings (password change)

### Help (1)
26. Manual / Walkthrough

## Key Features Implemented
- NET Profit on Dashboard (deducts GST + cash expenses from gross profit)
- Historical labels: "2026 Week 7 (Feb)", "February 2026"
- Markets preset copy between markets
- Excel export (Sessions, Products, Inventory, Cashflow, Sales by Month/Market)
- Data Repository with snapshots (versioning for Stock Planner lookback)
- JSON backup/restore (safe mode data encoding)
- Password change via Settings page
- In-app Manual with step-by-step walkthrough
- Role-based access (owner sees 26 pages, staff sees ~15)
- Backend owner-only protection on write endpoints

## Test Results
- Backend: 100% pass rate across all iterations
- Frontend: 100% pass rate
- Auth: owner@grillshack.nz / GrillShack2026!

## Upcoming (Phase 2)
- SQLite migration (replace MongoDB)
- Electron/Tauri desktop packaging
- Local login simplified auth
- Excel import fallback
