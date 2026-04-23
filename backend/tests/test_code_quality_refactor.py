"""
Backend tests for code quality refactoring (iteration 12)
Tests extracted helper functions and refactored components:
- _format_date_display, _accumulate_weekly, _format_week_row
- _aggregate_market_txns, _create_auto_backup
- _build_refill_product_trends, _finalize_refill_result
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for owner"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "owner@grillshack.nz",
        "password": "GrillShack2026!"
    })
    if response.status_code == 200:
        return response.cookies.get("access_token") or response.json().get("access_token")
    pytest.skip("Authentication failed")

@pytest.fixture(scope="module")
def auth_session(auth_token):
    """Session with auth cookies"""
    session = requests.Session()
    session.cookies.set("access_token", auth_token)
    return session


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """API root endpoint returns version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Grill Shack" in data["message"]
        print("✓ API root endpoint working")


class TestDashboardKPIs:
    """Dashboard KPIs endpoint - includes net_profit"""
    
    def test_kpis_returns_net_profit(self, auth_session):
        """GET /api/dashboard/kpis returns net_profit field"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        
        # Verify net_profit is present
        assert "net_profit" in data, "net_profit field missing from KPIs"
        assert isinstance(data["net_profit"], (int, float))
        
        # Verify other expected fields
        assert "total_sales" in data
        assert "total_profit" in data
        assert "gst_amount" in data
        print(f"✓ KPIs endpoint returns net_profit: ${data['net_profit']:.2f}")


class TestWeeklyControl:
    """Weekly Control endpoint - uses extracted helper functions"""
    
    def test_weekly_control_date_format(self, auth_session):
        """GET /api/dashboard/weekly-control returns MM/DD/YY formatted dates"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/weekly-control")
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of weeks
        assert isinstance(data, list)
        
        if len(data) > 0:
            week = data[0]
            # Check required fields
            assert "week" in week
            assert "start_date" in week
            assert "end_date" in week
            assert "sessions" in week
            assert "sales" in week
            
            # Verify date format is MM/DD/YY (DayName)
            start_date = week["start_date"]
            # Format should be like "02/15/26 (Saturday)"
            assert "/" in start_date, f"Date not in MM/DD/YY format: {start_date}"
            assert "(" in start_date and ")" in start_date, f"Day name missing: {start_date}"
            print(f"✓ Weekly Control dates formatted correctly: {start_date}")
        else:
            print("✓ Weekly Control endpoint working (no data)")


class TestRefillTrends:
    """Refill Trends endpoint - uses extracted helper functions"""
    
    def test_refill_trends_returns_data(self, auth_session):
        """GET /api/dashboard/refill-trends returns product trend data"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/refill-trends")
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of products
        assert isinstance(data, list)
        
        if len(data) > 0:
            product = data[0]
            # Check expected fields from _finalize_refill_result
            assert "product_id" in product
            assert "name" in product
            assert "current_cost" in product
            assert "avg_cost" in product
            assert "cost_trend_pct" in product
            assert "lifetime_units_sold" in product
            assert "lifetime_revenue" in product
            print(f"✓ Refill Trends returns {len(data)} products with trend data")
        else:
            print("✓ Refill Trends endpoint working (no data)")


class TestMarketModeFlow:
    """Market Mode full flow - tests _aggregate_market_txns and _create_auto_backup"""
    
    def test_market_mode_active_session(self, auth_session):
        """GET /api/market-mode/sessions/active returns session or null"""
        response = auth_session.get(f"{BASE_URL}/api/market-mode/sessions/active")
        assert response.status_code == 200
        # Can be null or session object
        print("✓ Market Mode active session endpoint working")
    
    def test_market_mode_full_flow(self, auth_session):
        """Full Market Mode flow: start session, add transaction, end session"""
        # Get markets first
        markets_res = auth_session.get(f"{BASE_URL}/api/markets")
        assert markets_res.status_code == 200
        markets = markets_res.json()
        
        if len(markets) == 0:
            pytest.skip("No markets available for testing")
        
        market = markets[0]
        
        # 1. Start session
        start_res = auth_session.post(f"{BASE_URL}/api/market-mode/sessions", json={
            "market_id": market["id"],
            "market_name": market["name"]
        })
        assert start_res.status_code == 200
        session = start_res.json()
        session_id = session["id"]
        print(f"✓ Started market session: {session_id}")
        
        # Get products for transaction
        products_res = auth_session.get(f"{BASE_URL}/api/products")
        products = products_res.json()
        
        if len(products) > 0:
            product = products[0]
            
            # 2. Add transaction
            txn_res = auth_session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction", json={
                "items": [{"product_id": product["id"], "product_name": product["name"], "units": 1, "unit_price": product["price"]}],
                "total": product["price"],
                "payment_method": "cash"
            })
            assert txn_res.status_code == 200
            txn = txn_res.json()
            assert "id" in txn
            assert txn["payment_method"] == "cash"
            print(f"✓ Added CASH transaction: ${txn['total']:.2f}")
            
            # Add EFTPOS transaction
            txn_res2 = auth_session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction", json={
                "items": [{"product_id": product["id"], "product_name": product["name"], "units": 2, "unit_price": product["price"]}],
                "total": product["price"] * 2,
                "payment_method": "eftpos"
            })
            assert txn_res2.status_code == 200
            print(f"✓ Added EFTPOS transaction: ${txn_res2.json()['total']:.2f}")
        
        # 3. End session (tests _aggregate_market_txns and _create_auto_backup)
        end_res = auth_session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/end")
        assert end_res.status_code == 200
        end_data = end_res.json()
        assert "transactions" in end_data
        print(f"✓ Ended session with {end_data['transactions']} transactions")


class TestHistoricalData:
    """Historical endpoint - no future dates"""
    
    def test_historical_no_future_dates(self, auth_session):
        """GET /api/dashboard/historical returns no future dates"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/historical")
        assert response.status_code == 200
        data = response.json()
        
        # Historical returns dict with week_over_week and month_over_month
        assert isinstance(data, dict)
        assert "week_over_week" in data or "month_over_month" in data
        
        # Check week_over_week data
        weeks = data.get("week_over_week", [])
        today = datetime.now()
        current_week = today.isocalendar()[1]
        current_year = today.year
        
        for week in weeks:
            period = week.get("period", "")
            # Period format is like "2026-W07"
            if period:
                parts = period.split("-W")
                if len(parts) == 2:
                    year = int(parts[0])
                    week_num = int(parts[1])
                    # Should not be future week
                    if year > current_year or (year == current_year and week_num > current_week):
                        pytest.fail(f"Future week found: {period}")
        
        print(f"✓ Historical endpoint returns {len(weeks)} weeks (no future dates)")


class TestProductsAndMarkets:
    """Products and Markets CRUD"""
    
    def test_get_products(self, auth_session):
        """GET /api/products returns product list"""
        response = auth_session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Products endpoint returns {len(data)} products")
    
    def test_get_markets(self, auth_session):
        """GET /api/markets returns market list"""
        response = auth_session.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Markets endpoint returns {len(data)} markets")


class TestReorderSuggestions:
    """Auto-Reorder endpoints"""
    
    def test_reorder_suggestions(self, auth_session):
        """GET /api/reorder/suggestions returns low stock items"""
        response = auth_session.get(f"{BASE_URL}/api/reorder/suggestions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Reorder suggestions returns {len(data)} items")
    
    def test_purchase_orders(self, auth_session):
        """GET /api/reorder/purchase-orders returns PO list"""
        response = auth_session.get(f"{BASE_URL}/api/reorder/purchase-orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Purchase orders returns {len(data)} POs")


class TestAuthFlow:
    """Authentication flow"""
    
    def test_login_success(self):
        """Login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        assert response.status_code == 200
        data = response.json()
        # Response can be user object directly or wrapped in "user" key
        if "user" in data:
            user = data["user"]
        else:
            user = data
        assert user["role"] == "owner"
        print(f"✓ Login successful for {user['email']}")
    
    def test_login_invalid_credentials(self):
        """Login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
