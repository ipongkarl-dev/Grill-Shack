"""
Phase 1 Features Backend Tests
Tests for:
1. Dashboard KPIs with net_profit, gst_amount, total_cash_expenses
2. Historical comparison with human-readable labels
3. Markets preset copy
4. Excel exports (sessions, products, inventory, cashflow, sales-by-month-market)
5. Data Repository (snapshots CRUD, backup/restore)
6. Password change
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment (fallback for CI)
OWNER_EMAIL = os.environ.get("TEST_OWNER_EMAIL", "owner@grillshack.nz")
OWNER_PASSWORD = os.environ.get("TEST_OWNER_PASSWORD", "GrillShack2026!")


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def owner_token(self):
        """Get owner authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_owner_login(self, owner_token):
        """Test owner can login successfully"""
        assert owner_token is not None
        assert len(owner_token) > 0
        print("✓ Owner login successful")


class TestDashboardKPIs:
    """Dashboard KPIs endpoint tests - includes net_profit, gst_amount, total_cash_expenses"""
    
    def test_dashboard_kpis_returns_net_profit(self):
        """GET /api/dashboard/kpis returns net_profit field"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields exist
        assert "net_profit" in data, "net_profit field missing from KPIs"
        assert "gst_amount" in data, "gst_amount field missing from KPIs"
        assert "total_cash_expenses" in data, "total_cash_expenses field missing from KPIs"
        assert "total_sales" in data
        assert "total_profit" in data
        
        # Verify types
        assert isinstance(data["net_profit"], (int, float))
        assert isinstance(data["gst_amount"], (int, float))
        assert isinstance(data["total_cash_expenses"], (int, float))
        
        print(f"✓ Dashboard KPIs: net_profit={data['net_profit']}, gst_amount={data['gst_amount']}, total_cash_expenses={data['total_cash_expenses']}")


class TestHistoricalComparison:
    """Historical comparison endpoint tests - includes human-readable labels"""
    
    def test_historical_returns_labels(self):
        """GET /api/dashboard/historical returns label field in week_over_week and month_over_month"""
        response = requests.get(f"{BASE_URL}/api/dashboard/historical")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "week_over_week" in data, "week_over_week missing"
        assert "month_over_month" in data, "month_over_month missing"
        
        # Check week_over_week has label field
        wow = data["week_over_week"]
        if len(wow) > 0:
            assert "label" in wow[0], "label field missing from week_over_week"
            assert "period" in wow[0], "period field missing from week_over_week"
            # Verify label format (e.g., "2026 Week 7 (Feb)")
            label = wow[0]["label"]
            assert "Week" in label or "-W" in label, f"Week label format unexpected: {label}"
            print(f"✓ Week label example: {label}")
        
        # Check month_over_month has label field
        mom = data["month_over_month"]
        if len(mom) > 0:
            assert "label" in mom[0], "label field missing from month_over_month"
            assert "period" in mom[0], "period field missing from month_over_month"
            # Verify label format (e.g., "February 2026")
            label = mom[0]["label"]
            print(f"✓ Month label example: {label}")
        
        print(f"✓ Historical comparison: {len(wow)} weeks, {len(mom)} months with labels")


class TestMarketsPresetCopy:
    """Markets preset copy endpoint tests"""
    
    @pytest.fixture(scope="class")
    def owner_session(self):
        """Get authenticated session for owner"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_markets(self, owner_session):
        """GET /api/markets returns list of markets"""
        response = owner_session.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200
        markets = response.json()
        assert isinstance(markets, list)
        print(f"✓ Found {len(markets)} markets")
        return markets
    
    def test_copy_preset_endpoint_exists(self, owner_session):
        """POST /api/markets/{id}/copy-preset endpoint exists"""
        # Get markets first
        markets_response = owner_session.get(f"{BASE_URL}/api/markets")
        markets = markets_response.json()
        
        if len(markets) < 2:
            pytest.skip("Need at least 2 markets to test copy preset")
        
        # Find a source market with preset_mix
        source = None
        target = None
        for m in markets:
            if m.get("preset_mix") and len(m.get("preset_mix", {})) > 0:
                source = m
            else:
                target = m
        
        if not source or not target:
            # Use first two markets
            source = markets[0]
            target = markets[1]
        
        # Test copy preset
        response = owner_session.post(
            f"{BASE_URL}/api/markets/{target['id']}/copy-preset",
            params={"source_market_id": source['id']}
        )
        assert response.status_code == 200, f"Copy preset failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Copy preset: {source['name']} → {target['name']}")


class TestExcelExports:
    """Excel export endpoint tests"""
    
    def test_sessions_excel_export(self):
        """GET /api/export/sessions-excel returns Excel file"""
        response = requests.get(f"{BASE_URL}/api/export/sessions-excel")
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        assert "GrillShack_Sessions.xlsx" in response.headers.get("content-disposition", "")
        assert len(response.content) > 0
        print(f"✓ Sessions Excel export: {len(response.content)} bytes")
    
    def test_products_excel_export(self):
        """GET /api/export/products-excel returns Excel file"""
        response = requests.get(f"{BASE_URL}/api/export/products-excel")
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        assert "GrillShack_Products.xlsx" in response.headers.get("content-disposition", "")
        assert len(response.content) > 0
        print(f"✓ Products Excel export: {len(response.content)} bytes")
    
    def test_inventory_excel_export(self):
        """GET /api/export/inventory-excel returns Excel file"""
        response = requests.get(f"{BASE_URL}/api/export/inventory-excel")
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        assert "GrillShack_Inventory.xlsx" in response.headers.get("content-disposition", "")
        print(f"✓ Inventory Excel export: {len(response.content)} bytes")
    
    def test_cashflow_excel_export(self):
        """GET /api/export/cashflow-excel returns Excel file"""
        response = requests.get(f"{BASE_URL}/api/export/cashflow-excel")
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        assert "GrillShack_Cashflow.xlsx" in response.headers.get("content-disposition", "")
        print(f"✓ Cashflow Excel export: {len(response.content)} bytes")
    
    def test_sales_by_month_market_export(self):
        """GET /api/export/sales-by-month-market returns Excel file"""
        response = requests.get(f"{BASE_URL}/api/export/sales-by-month-market")
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        assert "GrillShack_Sales_By_Month_Market.xlsx" in response.headers.get("content-disposition", "")
        assert len(response.content) > 0
        print(f"✓ Sales by Month/Market Excel export: {len(response.content)} bytes")


class TestDataRepository:
    """Data Repository tests - snapshots CRUD, backup/restore"""
    
    @pytest.fixture(scope="class")
    def owner_session(self):
        """Get authenticated session for owner"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_create_snapshot(self, owner_session):
        """POST /api/snapshots creates a snapshot"""
        response = owner_session.post(f"{BASE_URL}/api/snapshots", json={
            "label": "TEST_Phase1_Snapshot",
            "notes": "Test snapshot for Phase 1 testing"
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["label"] == "TEST_Phase1_Snapshot"
        assert "products" in data
        assert "session_summary" in data
        print(f"✓ Snapshot created: {data['id']}")
        return data["id"]
    
    def test_list_snapshots(self, owner_session):
        """GET /api/snapshots lists snapshots"""
        response = owner_session.get(f"{BASE_URL}/api/snapshots")
        assert response.status_code == 200, f"Failed: {response.text}"
        snapshots = response.json()
        assert isinstance(snapshots, list)
        print(f"✓ Listed {len(snapshots)} snapshots")
        return snapshots
    
    def test_update_snapshot(self, owner_session):
        """PUT /api/snapshots/{id} edits a snapshot"""
        # First create a snapshot
        create_response = owner_session.post(f"{BASE_URL}/api/snapshots", json={
            "label": "TEST_Update_Snapshot",
            "notes": "To be updated"
        })
        assert create_response.status_code == 200
        snapshot_id = create_response.json()["id"]
        
        # Update it
        update_response = owner_session.put(f"{BASE_URL}/api/snapshots/{snapshot_id}", json={
            "label": "TEST_Updated_Snapshot",
            "notes": "Updated notes"
        })
        assert update_response.status_code == 200, f"Failed: {update_response.text}"
        
        # Verify update
        get_response = owner_session.get(f"{BASE_URL}/api/snapshots/{snapshot_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["label"] == "TEST_Updated_Snapshot"
        assert data["notes"] == "Updated notes"
        print(f"✓ Snapshot updated: {snapshot_id}")
        
        # Cleanup
        owner_session.delete(f"{BASE_URL}/api/snapshots/{snapshot_id}")
    
    def test_delete_snapshot(self, owner_session):
        """DELETE /api/snapshots/{id} deletes a snapshot"""
        # First create a snapshot
        create_response = owner_session.post(f"{BASE_URL}/api/snapshots", json={
            "label": "TEST_Delete_Snapshot",
            "notes": "To be deleted"
        })
        assert create_response.status_code == 200
        snapshot_id = create_response.json()["id"]
        
        # Delete it
        delete_response = owner_session.delete(f"{BASE_URL}/api/snapshots/{snapshot_id}")
        assert delete_response.status_code == 200, f"Failed: {delete_response.text}"
        
        # Verify deletion
        get_response = owner_session.get(f"{BASE_URL}/api/snapshots/{snapshot_id}")
        assert get_response.status_code == 404
        print(f"✓ Snapshot deleted: {snapshot_id}")
    
    def test_backup_export(self, owner_session):
        """GET /api/backup/export returns JSON backup"""
        response = owner_session.get(f"{BASE_URL}/api/backup/export")
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "application/json" in response.headers.get("content-type", "")
        assert "GrillShack_Backup" in response.headers.get("content-disposition", "")
        
        # Verify backup structure
        data = response.json()
        assert "version" in data
        assert "products" in data
        assert "markets" in data
        assert "sessions" in data
        print(f"✓ Backup export: version={data['version']}, products={len(data.get('products', []))}")
    
    def test_backup_restore_validation(self, owner_session):
        """POST /api/backup/restore validates backup format"""
        # Test with invalid format
        response = owner_session.post(f"{BASE_URL}/api/backup/restore", json={
            "invalid": "data"
        })
        assert response.status_code == 400, "Should reject invalid backup format"
        print("✓ Backup restore validates format correctly")


class TestPasswordChange:
    """Password change endpoint tests"""
    
    @pytest.fixture(scope="class")
    def owner_session(self):
        """Get authenticated session for owner"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_change_password_wrong_current(self, owner_session):
        """POST /api/auth/change-password rejects wrong current password"""
        response = owner_session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": "WrongPassword123!",
            "new_password": "NewPassword123!"
        })
        assert response.status_code == 400, f"Should reject wrong password: {response.text}"
        print("✓ Password change rejects wrong current password")
    
    def test_change_password_short_new(self, owner_session):
        """POST /api/auth/change-password rejects short new password"""
        response = owner_session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": OWNER_PASSWORD,
            "new_password": "12345"  # Too short
        })
        assert response.status_code == 400, f"Should reject short password: {response.text}"
        print("✓ Password change rejects short new password")
    
    def test_change_password_success(self, owner_session):
        """POST /api/auth/change-password changes password successfully"""
        # Change to new password
        new_password = "NewGrillShack2026!"
        response = owner_session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": OWNER_PASSWORD,
            "new_password": new_password
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify can login with new password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": new_password
        })
        assert login_response.status_code == 200, "Cannot login with new password"
        
        # Change back to original password
        new_session = requests.Session()
        new_session.headers.update({"Authorization": f"Bearer {login_response.json()['token']}"})
        revert_response = new_session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": new_password,
            "new_password": OWNER_PASSWORD
        })
        assert revert_response.status_code == 200, "Failed to revert password"
        
        print("✓ Password change successful and reverted")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def owner_session(self):
        """Get authenticated session for owner"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": OWNER_EMAIL,
            "password": OWNER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_cleanup_test_snapshots(self, owner_session):
        """Clean up TEST_ prefixed snapshots"""
        response = owner_session.get(f"{BASE_URL}/api/snapshots")
        if response.status_code == 200:
            snapshots = response.json()
            for s in snapshots:
                if s.get("label", "").startswith("TEST_"):
                    owner_session.delete(f"{BASE_URL}/api/snapshots/{s['id']}")
                    print(f"  Cleaned up snapshot: {s['label']}")
        print("✓ Cleanup complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
