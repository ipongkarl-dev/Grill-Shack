"""
Test Phase A+B Features for Kitchen Analytics App
- Market Mode endpoints (POST sessions, transactions, end)
- Historical endpoint (no future dates)
- Weekly Control date format
- PO edit endpoint
- Supplier Directory
- Staff Performance
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment (fallback for CI)
OWNER_EMAIL = os.environ.get("TEST_OWNER_EMAIL", "owner@grillshack.nz")
OWNER_PASSWORD = os.environ.get("TEST_OWNER_PASSWORD", "GrillShack2026!")


class TestAuth:
    """Authentication tests"""
    
    def test_owner_login(self):
        """Test owner login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == OWNER_EMAIL
        assert data["role"] == "owner"
        print(f"✓ Owner login successful: {data['name']}")


@pytest.fixture(scope="module")
def auth_cookies():
    """Get auth cookies for authenticated requests"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": OWNER_EMAIL,
        "password": OWNER_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Authentication failed")
    return session.cookies


@pytest.fixture(scope="module")
def auth_session():
    """Get authenticated session"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": OWNER_EMAIL,
        "password": OWNER_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Authentication failed")
    return session


class TestMarketModeEndpoints:
    """Market Mode POS endpoints"""
    
    def test_get_active_session_initially_none(self, auth_session):
        """GET /api/market-mode/sessions/active - should return null if no active session"""
        response = auth_session.get(f"{BASE_URL}/api/market-mode/sessions/active")
        assert response.status_code == 200
        # Could be null or an existing session
        print(f"✓ Active session check: {response.json()}")
    
    def test_create_market_session(self, auth_session):
        """POST /api/market-mode/sessions - creates new session"""
        # First get a market
        markets_resp = auth_session.get(f"{BASE_URL}/api/markets")
        assert markets_resp.status_code == 200
        markets = markets_resp.json()
        
        if not markets:
            pytest.skip("No markets available")
        
        market = markets[0]
        
        response = auth_session.post(f"{BASE_URL}/api/market-mode/sessions", json={
            "market_id": market["id"],
            "market_name": market["name"]
        })
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["market_id"] == market["id"]
        assert data["status"] == "active"
        assert "transactions" in data
        print(f"✓ Market session created: {data['id']}")
        return data["id"]
    
    def test_add_transaction_to_session(self, auth_session):
        """POST /api/market-mode/sessions/{id}/transaction - adds transaction"""
        # Get active session
        active_resp = auth_session.get(f"{BASE_URL}/api/market-mode/sessions/active")
        assert active_resp.status_code == 200
        active = active_resp.json()
        
        if not active:
            pytest.skip("No active session to add transaction to")
        
        session_id = active["id"]
        
        # Get products
        products_resp = auth_session.get(f"{BASE_URL}/api/products")
        products = products_resp.json()
        if not products:
            pytest.skip("No products available")
        
        product = products[0]
        
        response = auth_session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction", json={
            "items": [{"product_id": product["id"], "product_name": product["name"], "units": 2, "unit_price": product["price"]}],
            "total": product["price"] * 2,
            "payment_method": "cash"
        })
        assert response.status_code == 200, f"Failed to add transaction: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["payment_method"] == "cash"
        assert "timestamp" in data
        print(f"✓ Transaction added: {data['id']}, total: ${data['total']}")
    
    def test_end_market_session(self, auth_session):
        """POST /api/market-mode/sessions/{id}/end - ends session and creates formal record"""
        # Get active session
        active_resp = auth_session.get(f"{BASE_URL}/api/market-mode/sessions/active")
        active = active_resp.json()
        
        if not active:
            pytest.skip("No active session to end")
        
        session_id = active["id"]
        
        response = auth_session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/end")
        assert response.status_code == 200, f"Failed to end session: {response.text}"
        data = response.json()
        assert "formal_session_id" in data
        assert "transactions" in data
        print(f"✓ Session ended: {data['transactions']} transactions, formal_session_id: {data['formal_session_id']}")


class TestHistoricalEndpoint:
    """Historical comparison endpoint - should not include future dates"""
    
    def test_historical_no_future_dates(self, auth_session):
        """GET /api/dashboard/historical - should filter out future dates"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/historical")
        assert response.status_code == 200
        data = response.json()
        
        assert "week_over_week" in data
        assert "month_over_month" in data
        
        today = datetime.now().date()
        
        # Check week_over_week for future dates
        for week in data["week_over_week"]:
            period = week.get("period", "")
            # Period format is like "2026-W07" or human readable
            if "-W" in period:
                year = int(period.split("-W")[0])
                week_num = int(period.split("-W")[1])
                # Rough check - if year is current year, week should not be far in future
                if year == today.year:
                    # Allow some buffer for current week
                    assert week_num <= today.isocalendar()[1] + 1, f"Future week found: {period}"
        
        # Check month_over_month for future dates
        for month in data["month_over_month"]:
            period = month.get("period", "")
            # Period format is like "2026-08" or human readable
            if "-" in period and len(period) == 7:
                year, month_num = period.split("-")
                year = int(year)
                month_num = int(month_num)
                if year == today.year:
                    assert month_num <= today.month, f"Future month found: {period}"
                elif year > today.year:
                    pytest.fail(f"Future year found: {period}")
        
        print(f"✓ Historical data has no future dates. Weeks: {len(data['week_over_week'])}, Months: {len(data['month_over_month'])}")


class TestWeeklyControl:
    """Weekly Control endpoint - date format check"""
    
    def test_weekly_control_date_format(self, auth_session):
        """GET /api/dashboard/weekly-control - dates should be MM/DD/YY with day name"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/weekly-control")
        assert response.status_code == 200
        data = response.json()
        
        if not data:
            pytest.skip("No weekly data available")
        
        # Check first entry for date format
        first_week = data[0]
        start_date = first_week.get("start_date", "")
        end_date = first_week.get("end_date", "")
        
        # Expected format: "02/15/26 (Sunday)"
        import re
        date_pattern = r'\d{2}/\d{2}/\d{2} \(\w+\)'
        
        assert re.match(date_pattern, start_date), f"Start date format incorrect: {start_date}, expected MM/DD/YY (DayName)"
        assert re.match(date_pattern, end_date), f"End date format incorrect: {end_date}, expected MM/DD/YY (DayName)"
        
        print(f"✓ Weekly control dates formatted correctly: {start_date} - {end_date}")


class TestPurchaseOrderEdit:
    """PO edit endpoint"""
    
    def test_po_edit_endpoint_exists(self, auth_session):
        """PUT /api/reorder/purchase-orders/{id} - endpoint should exist"""
        # First get existing POs
        response = auth_session.get(f"{BASE_URL}/api/reorder/purchase-orders")
        assert response.status_code == 200
        pos = response.json()
        
        if not pos:
            # Create a PO first
            suggestions_resp = auth_session.get(f"{BASE_URL}/api/reorder/suggestions")
            suggestions = suggestions_resp.json()
            if suggestions:
                create_resp = auth_session.post(f"{BASE_URL}/api/reorder/purchase-orders", json={
                    "supplier_id": "test",
                    "supplier_name": "Test Supplier",
                    "items": [{"product_id": suggestions[0]["product_id"], "product_name": suggestions[0]["product_name"], 
                              "qty_needed": 10, "unit_cost": 5.0, "estimated_cost": 50.0}],
                    "notes": "Test PO"
                })
                if create_resp.status_code == 200:
                    pos = [create_resp.json()]
        
        if not pos:
            pytest.skip("No POs available to test edit")
        
        po = pos[0]
        
        # Try to edit the PO
        edit_response = auth_session.put(f"{BASE_URL}/api/reorder/purchase-orders/{po['id']}", json={
            "notes": "Updated test note"
        })
        assert edit_response.status_code == 200, f"PO edit failed: {edit_response.text}"
        print(f"✓ PO edit endpoint working: {po['po_number']}")


class TestSupplierDirectory:
    """Supplier Directory CRUD"""
    
    def test_get_suppliers(self, auth_session):
        """GET /api/suppliers - list suppliers"""
        response = auth_session.get(f"{BASE_URL}/api/suppliers")
        assert response.status_code == 200
        suppliers = response.json()
        print(f"✓ Suppliers retrieved: {len(suppliers)} suppliers")
    
    def test_create_supplier(self, auth_session):
        """POST /api/suppliers - create supplier"""
        response = auth_session.post(f"{BASE_URL}/api/suppliers", json={
            "name": "TEST_Supplier_" + datetime.now().strftime("%H%M%S"),
            "contact_person": "Test Contact",
            "phone": "+64 21 123 4567",
            "email": "test@supplier.co.nz",
            "address": "Auckland",
            "products": [],
            "notes": "Test supplier"
        })
        assert response.status_code == 200, f"Create supplier failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ Supplier created: {data['name']}")
        return data["id"]


class TestStaffPerformance:
    """Staff Performance endpoint"""
    
    def test_staff_performance_endpoint(self, auth_session):
        """GET /api/dashboard/staff-performance - returns staff data"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/staff-performance")
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list of staff performance records
        assert isinstance(data, list)
        
        if data:
            first = data[0]
            assert "name" in first
            assert "total_sales" in first
            assert "sessions" in first
            print(f"✓ Staff performance: {len(data)} staff members, top: {first['name']} with ${first['total_sales']:.2f}")
        else:
            print("✓ Staff performance endpoint working (no data yet)")


class TestDashboardKPIs:
    """Dashboard KPIs including Net Profit"""
    
    def test_dashboard_kpis_has_net_profit(self, auth_session):
        """GET /api/dashboard/kpis - should include net_profit"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_sales" in data
        assert "total_profit" in data
        assert "net_profit" in data, "Net profit field missing from KPIs"
        assert "session_count" in data
        
        print(f"✓ Dashboard KPIs: Sales=${data['total_sales']:.2f}, Gross=${data['total_profit']:.2f}, Net=${data['net_profit']:.2f}")


class TestInventoryTracker:
    """Inventory Tracker COGS flow"""
    
    def test_inventory_list(self, auth_session):
        """GET /api/inventory - list inventory entries"""
        response = auth_session.get(f"{BASE_URL}/api/inventory")
        assert response.status_code == 200
        entries = response.json()
        print(f"✓ Inventory entries: {len(entries)}")
    
    def test_inventory_ingredients(self, auth_session):
        """GET /api/inventory/ingredients - unique ingredients list"""
        response = auth_session.get(f"{BASE_URL}/api/inventory/ingredients")
        assert response.status_code == 200
        ingredients = response.json()
        print(f"✓ Unique ingredients: {len(ingredients)}")


class TestProducts:
    """Products CRUD"""
    
    def test_get_products(self, auth_session):
        """GET /api/products - list products"""
        response = auth_session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0, "No products found"
        print(f"✓ Products: {len(products)} products")


class TestMarkets:
    """Markets CRUD"""
    
    def test_get_markets(self, auth_session):
        """GET /api/markets - list markets"""
        response = auth_session.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200
        markets = response.json()
        assert len(markets) > 0, "No markets found"
        print(f"✓ Markets: {len(markets)} markets")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
