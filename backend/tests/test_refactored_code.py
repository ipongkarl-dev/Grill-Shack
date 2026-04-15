"""
Test suite for code quality refactoring - iteration 10
Tests refactored backend helpers and extracted frontend components integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRefactoredBackendHelpers:
    """Test refactored backend helper functions via API endpoints"""
    
    def test_summarize_sessions_via_kpis(self):
        """Test summarize_sessions helper via /api/dashboard/kpis"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        
        # Verify summarize_sessions output fields
        assert 'total_sales' in data
        assert 'total_cogs' in data
        assert 'total_profit' in data
        assert 'total_units' in data
        assert 'total_cash_expenses' in data
        assert 'session_count' in data
        
        # Verify net_profit calculation (uses summarize_sessions)
        assert 'net_profit' in data
        assert 'gst_amount' in data
        print(f"SUCCESS: KPIs returned - net_profit: ${data['net_profit']}, total_sales: ${data['total_sales']}")
    
    def test_aggregate_market_sales_via_kpis(self):
        """Test aggregate_market_sales helper via /api/dashboard/kpis"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        
        # Verify aggregate_market_sales output
        assert 'market_sales' in data
        market_sales = data['market_sales']
        assert isinstance(market_sales, dict)
        
        # Each market should have sales, units, sessions
        for market, stats in market_sales.items():
            assert 'sales' in stats
            assert 'units' in stats
            assert 'sessions' in stats
        print(f"SUCCESS: Market sales aggregated for {len(market_sales)} markets")
    
    def test_period_label_via_historical(self):
        """Test _period_label helper via /api/dashboard/historical"""
        response = requests.get(f"{BASE_URL}/api/dashboard/historical")
        assert response.status_code == 200
        data = response.json()
        
        # Verify week_over_week has human-readable labels
        assert 'week_over_week' in data
        for week in data['week_over_week']:
            assert 'label' in week
            assert 'Week' in week['label']  # e.g., "2026 Week 7 (Feb)"
            assert '(' in week['label']  # Has month abbreviation
        
        # Verify month_over_month has human-readable labels
        assert 'month_over_month' in data
        for month in data['month_over_month']:
            assert 'label' in month
            # e.g., "February 2026"
            assert any(m in month['label'] for m in ['January', 'February', 'March', 'April', 'May', 'June', 
                                                       'July', 'August', 'September', 'October', 'November', 'December'])
        
        print(f"SUCCESS: Historical labels - Week: {data['week_over_week'][0]['label'] if data['week_over_week'] else 'N/A'}")
    
    def test_calc_growth_series_via_historical(self):
        """Test _calc_growth_series helper via /api/dashboard/historical"""
        response = requests.get(f"{BASE_URL}/api/dashboard/historical")
        assert response.status_code == 200
        data = response.json()
        
        # Verify growth series structure
        for week in data['week_over_week']:
            assert 'period' in week
            assert 'label' in week
            assert 'sales' in week
            assert 'profit' in week
            assert 'growth_pct' in week  # Field is growth_pct not growth
        
        print(f"SUCCESS: Growth series calculated with {len(data['week_over_week'])} weeks")


class TestExportEndpoints:
    """Test Excel export endpoints"""
    
    def test_export_sales_by_month_market(self):
        """Test /api/export/sales-by-month-market returns Excel"""
        response = requests.get(f"{BASE_URL}/api/export/sales-by-month-market")
        assert response.status_code == 200
        
        # Check content type is Excel
        content_type = response.headers.get('content-type', '')
        assert 'spreadsheet' in content_type or 'excel' in content_type or 'octet-stream' in content_type
        
        # Check file has content
        assert len(response.content) > 0
        print(f"SUCCESS: Sales by month-market Excel export - {len(response.content)} bytes")
    
    def test_export_sessions_excel(self):
        """Test /api/export/sessions-excel returns Excel"""
        response = requests.get(f"{BASE_URL}/api/export/sessions-excel")
        assert response.status_code == 200
        assert len(response.content) > 0
        print(f"SUCCESS: Sessions Excel export - {len(response.content)} bytes")
    
    def test_export_products_excel(self):
        """Test /api/export/products-excel returns Excel"""
        response = requests.get(f"{BASE_URL}/api/export/products-excel")
        assert response.status_code == 200
        assert len(response.content) > 0
        print(f"SUCCESS: Products Excel export - {len(response.content)} bytes")


class TestCRUDOperations:
    """Test CRUD operations still work after refactoring"""
    
    def test_sessions_crud(self):
        """Test sessions CRUD"""
        # GET sessions
        response = requests.get(f"{BASE_URL}/api/sessions?limit=5")
        assert response.status_code == 200
        sessions = response.json()
        assert isinstance(sessions, list)
        print(f"SUCCESS: GET sessions returned {len(sessions)} sessions")
    
    def test_products_crud(self):
        """Test products CRUD"""
        # GET products
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) > 0
        print(f"SUCCESS: GET products returned {len(products)} products")
    
    def test_inventory_crud(self):
        """Test inventory CRUD"""
        # GET inventory
        response = requests.get(f"{BASE_URL}/api/inventory")
        assert response.status_code == 200
        inventory = response.json()
        assert isinstance(inventory, list)
        print(f"SUCCESS: GET inventory returned {len(inventory)} entries")
    
    def test_markets_crud(self):
        """Test markets CRUD"""
        # GET markets
        response = requests.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200
        markets = response.json()
        assert isinstance(markets, list)
        assert len(markets) > 0
        print(f"SUCCESS: GET markets returned {len(markets)} markets")


class TestAllocationEndpoints:
    """Test allocation tool endpoints (uses AllocationSettingsPanel component)"""
    
    def test_get_allocation_settings(self):
        """Test GET /api/allocation/settings"""
        response = requests.get(f"{BASE_URL}/api/allocation/settings")
        assert response.status_code == 200
        data = response.json()
        
        # Verify settings structure
        assert 'owner_pay_percent' in data
        assert 'growth_percent' in data
        assert 'emergency_percent' in data
        assert 'buffer_percent' in data
        assert 'gst_rate' in data
        
        # Verify percentages sum to 100
        total = data['owner_pay_percent'] + data['growth_percent'] + data['emergency_percent'] + data['buffer_percent']
        assert abs(total - 100) < 0.1
        print(f"SUCCESS: Allocation settings - Owner: {data['owner_pay_percent']}%, Growth: {data['growth_percent']}%")
    
    def test_calculate_allocation(self):
        """Test GET /api/allocation/calculate"""
        response = requests.get(f"{BASE_URL}/api/allocation/calculate?week_sales=2500")
        assert response.status_code == 200
        data = response.json()
        
        # Verify calculation output
        assert 'week_sales' in data
        assert 'gst_amount' in data
        assert 'net_sales' in data
        assert 'gross_profit' in data
        assert 'allocations' in data
        
        allocations = data['allocations']
        assert 'owner_pay' in allocations
        assert 'growth' in allocations
        assert 'emergency' in allocations
        assert 'buffer' in allocations
        
        print(f"SUCCESS: Allocation calculated - Gross Profit: ${data['gross_profit']}, Owner Pay: ${allocations['owner_pay']}")


class TestOwnerAuth:
    """Test owner authentication"""
    
    def test_owner_login(self):
        """Test owner can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        assert response.status_code == 200
        data = response.json()
        # Login returns user data directly (not nested under 'user')
        assert 'role' in data
        assert data['role'] == 'owner'
        print(f"SUCCESS: Owner login - {data['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
