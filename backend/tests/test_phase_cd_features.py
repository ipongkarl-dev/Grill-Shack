"""
Phase C+D Features Backend Tests
- Calendar events CRUD
- Alert dismiss functionality
- Sales top items endpoint
- Market comparison with first_session_date
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kitchen-analytics-4.preview.emergentagent.com').rstrip('/')
OWNER_EMAIL = os.environ.get('TEST_OWNER_EMAIL', 'owner@grillshack.nz')
OWNER_PASSWORD = os.environ.get('TEST_OWNER_PASSWORD', 'GrillShack2026!')


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for owner"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": OWNER_EMAIL,
        "password": OWNER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestCalendarEvents:
    """Calendar events CRUD tests"""
    
    created_event_id = None
    
    def test_create_calendar_event(self, auth_headers):
        """POST /api/calendar/events creates event"""
        payload = {
            "title": "TEST_Market Day",
            "date": "2026-02-15",
            "notes": "Test event notes",
            "event_type": "market"
        }
        response = requests.post(f"{BASE_URL}/api/calendar/events", json=payload, headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Market Day"
        assert data["date"] == "2026-02-15"
        assert data["event_type"] == "market"
        TestCalendarEvents.created_event_id = data["id"]
        print(f"✓ Created calendar event: {data['id']}")
    
    def test_list_calendar_events(self, auth_headers):
        """GET /api/calendar/events lists events"""
        response = requests.get(f"{BASE_URL}/api/calendar/events", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check if our test event is in the list
        if TestCalendarEvents.created_event_id:
            found = any(e.get("id") == TestCalendarEvents.created_event_id for e in data)
            assert found, "Created event not found in list"
        print(f"✓ Listed {len(data)} calendar events")
    
    def test_delete_calendar_event(self, auth_headers):
        """DELETE /api/calendar/events/{id} removes event"""
        if not TestCalendarEvents.created_event_id:
            pytest.skip("No event to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/calendar/events/{TestCalendarEvents.created_event_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Deleted"
        
        # Verify deletion
        list_response = requests.get(f"{BASE_URL}/api/calendar/events", headers=auth_headers)
        events = list_response.json()
        found = any(e.get("id") == TestCalendarEvents.created_event_id for e in events)
        assert not found, "Event still exists after deletion"
        print(f"✓ Deleted calendar event: {TestCalendarEvents.created_event_id}")


class TestAlertDismiss:
    """Alert dismiss functionality tests"""
    
    def test_get_alerts(self, auth_headers):
        """GET /api/alerts returns alerts list"""
        response = requests.get(f"{BASE_URL}/api/alerts", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} alerts")
        return data
    
    def test_dismiss_alert(self, auth_headers):
        """POST /api/alerts/{id}/dismiss dismisses alert"""
        # First get alerts
        alerts_response = requests.get(f"{BASE_URL}/api/alerts", headers=auth_headers)
        alerts = alerts_response.json()
        
        if not alerts:
            # Create a test alert ID to dismiss
            test_alert_id = "TEST_alert_123"
        else:
            test_alert_id = alerts[0].get("id", "TEST_alert_123")
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/{test_alert_id}/dismiss",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Alert dismissed"
        print(f"✓ Dismissed alert: {test_alert_id}")
    
    def test_get_dismissed_alerts(self, auth_headers):
        """GET /api/alerts/dismissed returns dismissed IDs"""
        response = requests.get(f"{BASE_URL}/api/alerts/dismissed", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} dismissed alert IDs")


class TestSalesTopItems:
    """Sales top items endpoint tests"""
    
    def test_get_sales_top_items_all_markets(self, auth_headers):
        """GET /api/dashboard/sales-top-items returns ranked items"""
        response = requests.get(f"{BASE_URL}/api/dashboard/sales-top-items", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "ranked" in data
        assert "top3" in data
        assert "bottom" in data or data.get("bottom") is None
        assert "needs_push" in data
        
        # Validate top3 structure if exists
        if data["top3"]:
            for item in data["top3"]:
                assert "product_id" in item
                assert "name" in item
                assert "units" in item
                assert "revenue" in item
                assert "rank" in item
        
        print(f"✓ Got sales top items: {len(data['ranked'])} products ranked")
    
    def test_get_sales_top_items_with_market_filter(self, auth_headers):
        """GET /api/dashboard/sales-top-items?market_id=xxx filters by market"""
        # First get markets
        markets_response = requests.get(f"{BASE_URL}/api/markets", headers=auth_headers)
        markets = markets_response.json()
        
        if not markets:
            pytest.skip("No markets to filter by")
        
        market_id = markets[0].get("id")
        response = requests.get(
            f"{BASE_URL}/api/dashboard/sales-top-items?market_id={market_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "ranked" in data
        assert "top3" in data
        print(f"✓ Got sales top items for market {market_id}")


class TestMarketComparison:
    """Market comparison with date coverage tests"""
    
    def test_market_comparison_includes_first_session_date(self, auth_headers):
        """GET /api/dashboard/market-comparison includes first_session_date"""
        response = requests.get(f"{BASE_URL}/api/dashboard/market-comparison", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check that each market has first_session_date
        for market in data:
            assert "market" in market
            assert "first_session_date" in market, f"Market {market.get('market')} missing first_session_date"
            assert "total_sales" in market
            assert "total_profit" in market
            assert "sessions" in market
        
        print(f"✓ Market comparison includes first_session_date for {len(data)} markets")


class TestScalePlanner:
    """Scale planner endpoint tests"""
    
    def test_scale_planner_basic(self, auth_headers):
        """GET /api/dashboard/scale-planner returns projections"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/scale-planner?target_weekly_revenue=3000&weeks_horizon=12",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "target_weekly_revenue" in data
        assert "weeks_horizon" in data
        assert "current_weekly_avg" in data
        assert "projections" in data
        assert "investment" in data
        
        # Check projections structure
        proj = data["projections"]
        assert "gross_revenue" in proj
        assert "net_revenue" in proj
        assert "total_cogs" in proj
        assert "total_profit" in proj
        
        print(f"✓ Scale planner: target ${data['target_weekly_revenue']}/wk, current ${data['current_weekly_avg']}/wk")


class TestAllocationTool:
    """Allocation tool tests"""
    
    def test_allocation_calculate(self, auth_headers):
        """GET /api/allocation/calculate returns allocations"""
        response = requests.get(
            f"{BASE_URL}/api/allocation/calculate?week_sales=2500",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "week_sales" in data
        assert "gst_amount" in data
        assert "net_sales" in data
        assert "gross_profit" in data
        assert "allocations" in data
        
        # Check allocations
        alloc = data["allocations"]
        assert "owner_pay" in alloc
        assert "growth" in alloc
        assert "emergency" in alloc
        assert "buffer" in alloc
        
        print(f"✓ Allocation calculated: gross profit ${data['gross_profit']}")


class TestDashboardKPIs:
    """Dashboard KPIs tests"""
    
    def test_dashboard_kpis(self, auth_headers):
        """GET /api/dashboard/kpis returns 5 KPIs"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required KPIs
        assert "total_sales" in data
        assert "total_profit" in data
        assert "net_profit" in data
        assert "avg_cogs_percent" in data
        assert "session_count" in data
        
        print(f"✓ Dashboard KPIs: sales=${data['total_sales']}, profit=${data['total_profit']}, net=${data['net_profit']}")


class TestAuthFlow:
    """Authentication flow tests"""
    
    def test_login_success(self):
        """POST /api/auth/login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        # User data is at root level, not nested under "user"
        assert data.get("email") == OWNER_EMAIL or data.get("user", {}).get("email") == OWNER_EMAIL
        assert data.get("role") == "owner" or data.get("user", {}).get("role") == "owner"
        print(f"✓ Login successful for {OWNER_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        print("✓ Invalid login returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
