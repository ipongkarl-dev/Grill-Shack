"""
Test suite for code quality fixes iteration 16:
1. Critical: Fixed undefined variable `i` in server.py update_transaction — now uses `updated_txn` tracked variable
2. Backend: PUT /api/market-mode/sessions/{id}/transaction/{txn_id} works correctly
3. Backend: DELETE /api/market-mode/sessions/{id}/transaction/{txn_id} works
4. Backend: GET /api/export/market-transactions-excel returns Excel
5. Backend: GET /api/dashboard/kpis returns data
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCodeQualityFixes:
    """Test the code quality fixes, especially the update_transaction fix."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as owner
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        if login_resp.status_code == 200:
            token = login_resp.json().get("access_token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
            # Also set cookies if returned
            self.session.cookies.update(login_resp.cookies)
        yield
        # Cleanup: end any active market session
        try:
            active = self.session.get(f"{BASE_URL}/api/market-mode/sessions/active")
            if active.status_code == 200 and active.json():
                session_id = active.json().get("id")
                if session_id:
                    self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/end")
        except:
            pass

    def test_01_login_owner(self):
        """Test owner login works."""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        # Response returns user data directly with email field
        assert "email" in data or "access_token" in data, "Missing email or token in response"
        print("✓ Owner login successful")

    def test_02_dashboard_kpis(self):
        """Test GET /api/dashboard/kpis returns data."""
        resp = self.session.get(f"{BASE_URL}/api/dashboard/kpis")
        assert resp.status_code == 200, f"KPIs failed: {resp.text}"
        data = resp.json()
        # Verify expected fields
        assert "total_sales" in data, "Missing total_sales"
        assert "total_cogs" in data, "Missing total_cogs"
        assert "total_profit" in data, "Missing total_profit"
        assert "session_count" in data, "Missing session_count"
        print(f"✓ Dashboard KPIs returned: {data.get('session_count')} sessions, ${data.get('total_sales')} sales")

    def test_03_get_products(self):
        """Test GET /api/products returns products."""
        resp = self.session.get(f"{BASE_URL}/api/products")
        assert resp.status_code == 200, f"Products failed: {resp.text}"
        products = resp.json()
        assert isinstance(products, list), "Products should be a list"
        assert len(products) > 0, "Should have at least one product"
        print(f"✓ Got {len(products)} products")
        return products

    def test_04_get_markets(self):
        """Test GET /api/markets returns markets."""
        resp = self.session.get(f"{BASE_URL}/api/markets")
        assert resp.status_code == 200, f"Markets failed: {resp.text}"
        markets = resp.json()
        assert isinstance(markets, list), "Markets should be a list"
        print(f"✓ Got {len(markets)} markets")
        return markets

    def test_05_market_mode_full_flow(self):
        """Test full Market Mode POS flow including the critical update_transaction fix."""
        # Get products and markets
        products_resp = self.session.get(f"{BASE_URL}/api/products")
        assert products_resp.status_code == 200
        products = products_resp.json()
        assert len(products) > 0, "Need products for test"
        
        markets_resp = self.session.get(f"{BASE_URL}/api/markets")
        assert markets_resp.status_code == 200
        markets = markets_resp.json()
        assert len(markets) > 0, "Need markets for test"
        
        market = markets[0]
        product = products[0]
        
        # 1. Start a market session
        start_resp = self.session.post(f"{BASE_URL}/api/market-mode/sessions", json={
            "market_id": market["id"],
            "market_name": market["name"]
        })
        assert start_resp.status_code == 200, f"Start session failed: {start_resp.text}"
        session = start_resp.json()
        session_id = session["id"]
        print(f"✓ Started market session: {session_id}")
        
        # 2. Add a CASH transaction
        txn_resp = self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction", json={
            "items": [{"product_id": product["id"], "product_name": product["name"], "units": 2, "unit_price": product["price"]}],
            "total": product["price"] * 2,
            "payment_method": "cash"
        })
        assert txn_resp.status_code == 200, f"Add transaction failed: {txn_resp.text}"
        txn = txn_resp.json()
        txn_id = txn["id"]
        print(f"✓ Added CASH transaction: {txn_id}")
        
        # 3. CRITICAL TEST: Update the transaction (this was the bug - undefined variable `i`)
        update_resp = self.session.put(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction/{txn_id}", json={
            "items": [{"product_id": product["id"], "product_name": product["name"], "units": 3, "unit_price": product["price"]}],
            "total": product["price"] * 3,
            "payment_method": "eftpos"
        })
        assert update_resp.status_code == 200, f"Update transaction failed (this was the critical bug): {update_resp.text}"
        updated_txn = update_resp.json()
        assert updated_txn.get("payment_method") == "eftpos", "Payment method not updated"
        assert updated_txn.get("total") == product["price"] * 3, "Total not updated"
        print(f"✓ CRITICAL: Update transaction works correctly (fixed undefined variable bug)")
        
        # 4. Add another transaction for delete test
        txn2_resp = self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction", json={
            "items": [{"product_id": product["id"], "product_name": product["name"], "units": 1, "unit_price": product["price"]}],
            "total": product["price"],
            "payment_method": "cash"
        })
        assert txn2_resp.status_code == 200
        txn2_id = txn2_resp.json()["id"]
        print(f"✓ Added second transaction: {txn2_id}")
        
        # 5. Delete the second transaction
        delete_resp = self.session.delete(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction/{txn2_id}")
        assert delete_resp.status_code == 200, f"Delete transaction failed: {delete_resp.text}"
        print(f"✓ Deleted transaction: {txn2_id}")
        
        # 6. End the session
        end_resp = self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/end")
        assert end_resp.status_code == 200, f"End session failed: {end_resp.text}"
        print(f"✓ Ended market session")

    def test_06_update_nonexistent_transaction(self):
        """Test PUT on non-existent transaction returns 404."""
        # Start a session first
        markets_resp = self.session.get(f"{BASE_URL}/api/markets")
        markets = markets_resp.json()
        if not markets:
            pytest.skip("No markets available")
        
        start_resp = self.session.post(f"{BASE_URL}/api/market-mode/sessions", json={
            "market_id": markets[0]["id"],
            "market_name": markets[0]["name"]
        })
        assert start_resp.status_code == 200
        session_id = start_resp.json()["id"]
        
        # Try to update non-existent transaction
        fake_txn_id = str(uuid.uuid4())
        update_resp = self.session.put(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction/{fake_txn_id}", json={
            "items": [],
            "total": 0,
            "payment_method": "cash"
        })
        assert update_resp.status_code == 404, f"Expected 404, got {update_resp.status_code}"
        print(f"✓ Update non-existent transaction returns 404")
        
        # Cleanup
        self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/end")

    def test_07_delete_nonexistent_transaction(self):
        """Test DELETE on non-existent transaction returns 404."""
        # Start a session first
        markets_resp = self.session.get(f"{BASE_URL}/api/markets")
        markets = markets_resp.json()
        if not markets:
            pytest.skip("No markets available")
        
        start_resp = self.session.post(f"{BASE_URL}/api/market-mode/sessions", json={
            "market_id": markets[0]["id"],
            "market_name": markets[0]["name"]
        })
        assert start_resp.status_code == 200
        session_id = start_resp.json()["id"]
        
        # Try to delete non-existent transaction
        fake_txn_id = str(uuid.uuid4())
        delete_resp = self.session.delete(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction/{fake_txn_id}")
        assert delete_resp.status_code == 404, f"Expected 404, got {delete_resp.status_code}"
        print(f"✓ Delete non-existent transaction returns 404")
        
        # Cleanup
        self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/end")

    def test_08_export_market_transactions_excel(self):
        """Test GET /api/export/market-transactions-excel returns Excel file."""
        resp = self.session.get(f"{BASE_URL}/api/export/market-transactions-excel")
        assert resp.status_code == 200, f"Excel export failed: {resp.text}"
        # Check content type
        content_type = resp.headers.get("content-type", "")
        assert "spreadsheet" in content_type or "excel" in content_type or "octet-stream" in content_type, f"Unexpected content type: {content_type}"
        # Check content disposition
        content_disp = resp.headers.get("content-disposition", "")
        assert "attachment" in content_disp.lower() or "xlsx" in content_disp.lower(), f"Missing attachment header: {content_disp}"
        print(f"✓ Excel export returns valid file (content-type: {content_type})")

    def test_09_scale_planner_endpoint(self):
        """Test GET /api/dashboard/scale-planner returns data."""
        resp = self.session.get(f"{BASE_URL}/api/dashboard/scale-planner?target_weekly_revenue=3000&weeks_horizon=12")
        assert resp.status_code == 200, f"Scale planner failed: {resp.text}"
        data = resp.json()
        assert "target_weekly_revenue" in data, "Missing target_weekly_revenue"
        assert "weeks_horizon" in data, "Missing weeks_horizon"
        assert "projections" in data, "Missing projections"
        print(f"✓ Scale planner returns data: target={data.get('target_weekly_revenue')}, horizon={data.get('weeks_horizon')}w")

    def test_10_market_comparison_endpoint(self):
        """Test GET /api/dashboard/market-comparison returns data."""
        resp = self.session.get(f"{BASE_URL}/api/dashboard/market-comparison")
        assert resp.status_code == 200, f"Market comparison failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Market comparison should return a list"
        if len(data) > 0:
            # Check first_session_date field exists (for date coverage badge)
            assert "first_session_date" in data[0], "Missing first_session_date field"
        print(f"✓ Market comparison returns {len(data)} markets")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
