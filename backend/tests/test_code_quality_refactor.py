"""
Test suite for code quality refactoring verification.
Tests: Backend API endpoints, extracted functions, and refactored code.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kitchen-analytics-4.preview.emergentagent.com').rstrip('/')

# Test credentials from environment (fallback for CI)
OWNER_EMAIL = os.environ.get("TEST_OWNER_EMAIL", "owner@grillshack.nz")
OWNER_PASSWORD = os.environ.get("TEST_OWNER_PASSWORD", "GrillShack2026!")


class TestBackendAPIs:
    """Test backend API endpoints are working after refactoring."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for tests."""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_api_root(self):
        """Test API root endpoint."""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Grill Shack Management API"
        print("✓ API root endpoint working")
    
    def test_dashboard_kpis(self):
        """Test GET /api/dashboard/kpis returns 5 KPIs."""
        response = self.session.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        # Verify KPI fields exist
        assert "total_sales" in data
        assert "total_cogs" in data
        assert "total_profit" in data
        assert "net_profit" in data
        assert "avg_cogs_percent" in data
        assert "session_count" in data
        print(f"✓ Dashboard KPIs: total_sales={data['total_sales']}, net_profit={data['net_profit']}")
    
    def test_dashboard_sales_top_items(self):
        """Test GET /api/dashboard/sales-top-items returns ranked products."""
        response = self.session.get(f"{BASE_URL}/api/dashboard/sales-top-items")
        assert response.status_code == 200
        data = response.json()
        # Verify structure from extracted _rank_products function
        assert "ranked" in data
        assert "top3" in data
        assert "bottom" in data
        assert "needs_push" in data
        print(f"✓ Sales top items: {len(data['ranked'])} products ranked, top3={len(data['top3'])}")
    
    def test_calendar_events(self):
        """Test GET /api/calendar/events returns events list."""
        response = self.session.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Calendar events: {len(data)} events found")
    
    def test_alerts_endpoint(self):
        """Test GET /api/alerts returns alerts list."""
        response = self.session.get(f"{BASE_URL}/api/alerts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Alerts: {len(data)} alerts found")
    
    def test_products_endpoint(self):
        """Test GET /api/products returns products list."""
        response = self.session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Products: {len(data)} products found")
    
    def test_markets_endpoint(self):
        """Test GET /api/markets returns markets list."""
        response = self.session.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Markets: {len(data)} markets found")
    
    def test_sessions_endpoint(self):
        """Test GET /api/sessions returns sessions list."""
        response = self.session.get(f"{BASE_URL}/api/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Sessions: {len(data)} sessions found")


class TestAuthFlow:
    """Test authentication flow."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for tests."""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_owner_login_success(self):
        """Test owner login with correct credentials."""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == OWNER_EMAIL
        assert data["role"] == "owner"
        print(f"✓ Owner login successful: {data['email']}, role={data['role']}")
        return data["token"]
    
    def test_invalid_login(self):
        """Test login with invalid credentials returns 401."""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly returns 401")


class TestExtractedFunctions:
    """Test that extracted backend functions work correctly via API."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for tests."""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_sales_top_items_with_market_filter(self):
        """Test sales-top-items endpoint with market_id filter."""
        # First get markets
        markets_response = self.session.get(f"{BASE_URL}/api/markets")
        assert markets_response.status_code == 200
        markets = markets_response.json()
        
        if markets:
            market_id = markets[0]["id"]
            response = self.session.get(f"{BASE_URL}/api/dashboard/sales-top-items?market_id={market_id}")
            assert response.status_code == 200
            data = response.json()
            assert "ranked" in data
            assert "top3" in data
            print(f"✓ Sales top items with market filter: market_id={market_id}")
        else:
            print("⚠ No markets found, skipping market filter test")
    
    def test_scale_planner_endpoint(self):
        """Test scale planner endpoint (uses compute_scale_projections)."""
        response = self.session.get(f"{BASE_URL}/api/dashboard/scale-planner")
        assert response.status_code == 200
        data = response.json()
        assert "target_weekly_revenue" in data
        assert "projections" in data
        assert "investment" in data
        print(f"✓ Scale planner: target_weekly={data['target_weekly_revenue']}")
    
    def test_allocation_calculate(self):
        """Test allocation calculate endpoint."""
        response = self.session.get(f"{BASE_URL}/api/allocation/calculate?week_sales=1000")
        assert response.status_code == 200
        data = response.json()
        assert "week_sales" in data
        assert "allocations" in data
        assert "owner_pay" in data["allocations"]
        print(f"✓ Allocation calculate: week_sales={data['week_sales']}, owner_pay={data['allocations']['owner_pay']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
