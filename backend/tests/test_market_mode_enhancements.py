"""
Test Market Mode Enhancements:
- Transaction log editable with edit/delete buttons per transaction
- Products clickable without live session (training mode)
- Transaction export to Excel with date/timestamps
- Pause/idle button to prevent accidental Save & End
- Backend: PUT/DELETE transaction endpoints, Excel export endpoint
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMarketModeAuth:
    """Test authentication for Market Mode"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_owner_login(self):
        """Test owner login with correct credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        # Login returns user data directly, token is set via httpOnly cookie
        assert "email" in data or "user" in data or "access_token" in data, "Missing user data in response"
        print(f"Owner login successful: {data.get('email', data.get('user', {}).get('email', 'N/A'))}")


class TestMarketModeBasicEndpoints:
    """Test basic Market Mode endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login first
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        if login_resp.status_code == 200:
            data = login_resp.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    
    def test_get_products(self):
        """Test products endpoint - needed for training mode"""
        response = self.session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Failed to get products: {response.text}"
        products = response.json()
        assert isinstance(products, list), "Products should be a list"
        assert len(products) > 0, "Should have at least one product"
        print(f"Products available: {len(products)}")
    
    def test_get_markets(self):
        """Test markets endpoint - needed for session start"""
        response = self.session.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200, f"Failed to get markets: {response.text}"
        markets = response.json()
        assert isinstance(markets, list), "Markets should be a list"
        print(f"Markets available: {len(markets)}")
    
    def test_get_active_session(self):
        """Test getting active market session (may be null)"""
        response = self.session.get(f"{BASE_URL}/api/market-mode/sessions/active")
        assert response.status_code == 200, f"Failed to get active session: {response.text}"
        # Can be null if no active session
        print(f"Active session response: {response.json()}")


class TestMarketModeFullFlow:
    """Test full Market Mode flow: start -> add txn -> edit txn -> delete txn -> end"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login first
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        if login_resp.status_code == 200:
            data = login_resp.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
        
        # Get a market for testing
        markets_resp = self.session.get(f"{BASE_URL}/api/markets")
        if markets_resp.status_code == 200:
            markets = markets_resp.json()
            if markets:
                self.test_market = markets[0]
            else:
                self.test_market = {"id": "test-market", "name": "Test Market"}
        else:
            self.test_market = {"id": "test-market", "name": "Test Market"}
        
        # Get products for testing
        products_resp = self.session.get(f"{BASE_URL}/api/products")
        if products_resp.status_code == 200:
            self.products = products_resp.json()
        else:
            self.products = []
    
    def test_01_start_session(self):
        """Test starting a new market session"""
        # First end any existing active session
        active_resp = self.session.get(f"{BASE_URL}/api/market-mode/sessions/active")
        if active_resp.status_code == 200 and active_resp.json():
            active_session = active_resp.json()
            # End it
            self.session.post(f"{BASE_URL}/api/market-mode/sessions/{active_session['id']}/end")
        
        response = self.session.post(f"{BASE_URL}/api/market-mode/sessions", json={
            "market_id": self.test_market.get("id", "test-market"),
            "market_name": self.test_market.get("name", "Test Market")
        })
        assert response.status_code == 200, f"Failed to start session: {response.text}"
        data = response.json()
        assert "id" in data, "Session should have an ID"
        assert data.get("status") == "active", "Session should be active"
        print(f"Session started: {data['id']}")
        # Store for next tests
        TestMarketModeFullFlow.session_id = data["id"]
    
    def test_02_add_transaction_cash(self):
        """Test adding a CASH transaction"""
        session_id = getattr(TestMarketModeFullFlow, 'session_id', None)
        if not session_id:
            pytest.skip("No active session from previous test")
        
        if not self.products:
            pytest.skip("No products available")
        
        product = self.products[0]
        response = self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction", json={
            "items": [
                {"product_id": product["id"], "product_name": product["name"], "units": 2, "unit_price": product["price"]}
            ],
            "total": product["price"] * 2,
            "payment_method": "cash"
        })
        assert response.status_code == 200, f"Failed to add transaction: {response.text}"
        data = response.json()
        assert "id" in data, "Transaction should have an ID"
        assert data.get("payment_method") == "cash", "Payment method should be cash"
        print(f"Cash transaction added: {data['id']}")
        TestMarketModeFullFlow.txn_id_cash = data["id"]
    
    def test_03_add_transaction_eftpos(self):
        """Test adding an EFTPOS transaction"""
        session_id = getattr(TestMarketModeFullFlow, 'session_id', None)
        if not session_id:
            pytest.skip("No active session from previous test")
        
        if not self.products:
            pytest.skip("No products available")
        
        product = self.products[0] if len(self.products) < 2 else self.products[1]
        response = self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction", json={
            "items": [
                {"product_id": product["id"], "product_name": product["name"], "units": 1, "unit_price": product["price"]}
            ],
            "total": product["price"],
            "payment_method": "eftpos"
        })
        assert response.status_code == 200, f"Failed to add transaction: {response.text}"
        data = response.json()
        assert "id" in data, "Transaction should have an ID"
        assert data.get("payment_method") == "eftpos", "Payment method should be eftpos"
        print(f"EFTPOS transaction added: {data['id']}")
        TestMarketModeFullFlow.txn_id_eftpos = data["id"]
    
    def test_04_edit_transaction(self):
        """Test PUT /api/market-mode/sessions/{id}/transaction/{txn_id} - edit transaction"""
        session_id = getattr(TestMarketModeFullFlow, 'session_id', None)
        txn_id = getattr(TestMarketModeFullFlow, 'txn_id_cash', None)
        if not session_id or not txn_id:
            pytest.skip("No session or transaction from previous tests")
        
        if not self.products:
            pytest.skip("No products available")
        
        product = self.products[0]
        # Edit: change qty to 3 and payment to eftpos
        response = self.session.put(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction/{txn_id}", json={
            "items": [
                {"product_id": product["id"], "product_name": product["name"], "units": 3, "unit_price": product["price"]}
            ],
            "total": product["price"] * 3,
            "payment_method": "eftpos"
        })
        assert response.status_code == 200, f"Failed to edit transaction: {response.text}"
        data = response.json()
        assert data.get("payment_method") == "eftpos", "Payment method should be updated to eftpos"
        print(f"Transaction edited successfully: {data}")
    
    def test_05_delete_transaction(self):
        """Test DELETE /api/market-mode/sessions/{id}/transaction/{txn_id} - delete transaction"""
        session_id = getattr(TestMarketModeFullFlow, 'session_id', None)
        txn_id = getattr(TestMarketModeFullFlow, 'txn_id_eftpos', None)
        if not session_id or not txn_id:
            pytest.skip("No session or transaction from previous tests")
        
        response = self.session.delete(f"{BASE_URL}/api/market-mode/sessions/{session_id}/transaction/{txn_id}")
        assert response.status_code == 200, f"Failed to delete transaction: {response.text}"
        data = response.json()
        assert "message" in data, "Should have success message"
        print(f"Transaction deleted: {data}")
    
    def test_06_end_session(self):
        """Test ending the market session with Save & End"""
        session_id = getattr(TestMarketModeFullFlow, 'session_id', None)
        if not session_id:
            pytest.skip("No active session from previous test")
        
        response = self.session.post(f"{BASE_URL}/api/market-mode/sessions/{session_id}/end")
        assert response.status_code == 200, f"Failed to end session: {response.text}"
        data = response.json()
        assert "formal_session_id" in data, "Should create a formal session"
        assert "transactions" in data, "Should report transaction count"
        print(f"Session ended: {data}")


class TestExcelExport:
    """Test Excel export endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_export_market_transactions_excel(self):
        """Test GET /api/export/market-transactions-excel returns Excel file"""
        response = self.session.get(f"{BASE_URL}/api/export/market-transactions-excel")
        assert response.status_code == 200, f"Failed to export Excel: {response.text}"
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheet" in content_type or "excel" in content_type or "octet-stream" in content_type, \
            f"Expected Excel content type, got: {content_type}"
        
        # Check content disposition
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, "Should be an attachment download"
        assert ".xlsx" in content_disp, "Should be an xlsx file"
        
        # Check content length
        assert len(response.content) > 0, "Excel file should have content"
        print(f"Excel export successful: {len(response.content)} bytes")


class TestTransactionEdgeCases:
    """Test edge cases for transaction edit/delete"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login first
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "owner@grillshack.nz",
            "password": "GrillShack2026!"
        })
        if login_resp.status_code == 200:
            data = login_resp.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    
    def test_edit_nonexistent_transaction(self):
        """Test editing a non-existent transaction returns 404"""
        response = self.session.put(f"{BASE_URL}/api/market-mode/sessions/fake-session/transaction/fake-txn", json={
            "items": [],
            "total": 0,
            "payment_method": "cash"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Edit non-existent transaction correctly returns 404")
    
    def test_delete_nonexistent_transaction(self):
        """Test deleting a non-existent transaction returns 404"""
        response = self.session.delete(f"{BASE_URL}/api/market-mode/sessions/fake-session/transaction/fake-txn")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Delete non-existent transaction correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
