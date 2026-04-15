#!/usr/bin/env python3
"""
Test suite for Role-Based Access Control and Auto-Reorder features.
Tests:
1. Owner vs Staff role restrictions on endpoints
2. Auto-Reorder suggestions and purchase order workflow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kitchen-analytics-4.preview.emergentagent.com').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test credentials from environment (fallback for CI)
OWNER_EMAIL = os.environ.get("TEST_OWNER_EMAIL", "owner@grillshack.nz")
OWNER_PASSWORD = os.environ.get("TEST_OWNER_PASSWORD", "GrillShack2026!")
STAFF_EMAIL = os.environ.get("TEST_STAFF_EMAIL", "staff@grillshack.nz")
STAFF_PASSWORD = os.environ.get("TEST_STAFF_PASSWORD", "Staff2026!")


@pytest.fixture(scope="module")
def owner_token():
    """Get owner authentication token"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": OWNER_EMAIL,
        "password": OWNER_PASSWORD
    })
    assert response.status_code == 200, f"Owner login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in owner login response"
    assert data.get("role") == "owner", f"Expected owner role, got {data.get('role')}"
    return data["token"]


@pytest.fixture(scope="module")
def staff_token():
    """Get staff authentication token"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": STAFF_EMAIL,
        "password": STAFF_PASSWORD
    })
    assert response.status_code == 200, f"Staff login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in staff login response"
    assert data.get("role") == "staff", f"Expected staff role, got {data.get('role')}"
    return data["token"]


@pytest.fixture
def owner_headers(owner_token):
    """Headers with owner auth"""
    return {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}


@pytest.fixture
def staff_headers(staff_token):
    """Headers with staff auth"""
    return {"Authorization": f"Bearer {staff_token}", "Content-Type": "application/json"}


# ============ ROLE-BASED ACCESS TESTS ============

class TestOwnerAccess:
    """Test that owner can access all protected endpoints"""
    
    def test_owner_can_get_products(self, owner_headers):
        """Owner can GET products"""
        response = requests.get(f"{API_URL}/products", headers=owner_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Owner retrieved {len(data)} products")
    
    def test_owner_can_post_products(self, owner_headers):
        """Owner can POST products (create)"""
        test_product = {
            "name": "TEST_Owner_Product",
            "code": "TEST_OWN",
            "price": 15.0,
            "food_cost": 5.0,
            "packaging_cost": 1.0,
            "opening_stock": 10,
            "reorder_point": 5
        }
        response = requests.post(f"{API_URL}/products", json=test_product, headers=owner_headers)
        assert response.status_code == 200, f"Owner POST products failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Owner_Product"
        # Cleanup
        requests.delete(f"{API_URL}/products/{data['id']}", headers=owner_headers)
    
    def test_owner_can_update_allocation_settings(self, owner_headers):
        """Owner can PUT allocation settings"""
        response = requests.put(f"{API_URL}/allocation/settings", 
                               json={"owner_pay_percent": 30}, 
                               headers=owner_headers)
        assert response.status_code == 200, f"Owner PUT allocation failed: {response.text}"
    
    def test_owner_can_post_suppliers(self, owner_headers):
        """Owner can POST suppliers"""
        test_supplier = {
            "name": "TEST_Owner_Supplier",
            "contact_person": "Test Contact",
            "phone": "123456789"
        }
        response = requests.post(f"{API_URL}/suppliers", json=test_supplier, headers=owner_headers)
        assert response.status_code == 200, f"Owner POST suppliers failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Owner_Supplier"
        # Cleanup
        requests.delete(f"{API_URL}/suppliers/{data['id']}", headers=owner_headers)
    
    def test_owner_can_access_reorder_suggestions(self, owner_headers):
        """Owner can GET reorder suggestions"""
        response = requests.get(f"{API_URL}/reorder/suggestions", headers=owner_headers)
        assert response.status_code == 200, f"Owner GET reorder suggestions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Owner retrieved {len(data)} reorder suggestions")


class TestStaffRestrictions:
    """Test that staff cannot access owner-only endpoints (should get 403)"""
    
    def test_staff_cannot_post_products(self, staff_headers):
        """Staff cannot POST products - should get 403"""
        test_product = {
            "name": "TEST_Staff_Product",
            "code": "TEST_STF",
            "price": 10.0,
            "food_cost": 3.0,
            "packaging_cost": 0.5
        }
        response = requests.post(f"{API_URL}/products", json=test_product, headers=staff_headers)
        assert response.status_code == 403, f"Expected 403 for staff POST products, got {response.status_code}: {response.text}"
        print("Staff correctly blocked from POST /products (403)")
    
    def test_staff_cannot_put_allocation_settings(self, staff_headers):
        """Staff cannot PUT allocation settings - should get 403"""
        response = requests.put(f"{API_URL}/allocation/settings", 
                               json={"owner_pay_percent": 50}, 
                               headers=staff_headers)
        assert response.status_code == 403, f"Expected 403 for staff PUT allocation, got {response.status_code}: {response.text}"
        print("Staff correctly blocked from PUT /allocation/settings (403)")
    
    def test_staff_cannot_post_suppliers(self, staff_headers):
        """Staff cannot POST suppliers - should get 403"""
        test_supplier = {
            "name": "TEST_Staff_Supplier",
            "contact_person": "Staff Contact"
        }
        response = requests.post(f"{API_URL}/suppliers", json=test_supplier, headers=staff_headers)
        assert response.status_code == 403, f"Expected 403 for staff POST suppliers, got {response.status_code}: {response.text}"
        print("Staff correctly blocked from POST /suppliers (403)")
    
    def test_staff_cannot_access_reorder_suggestions(self, staff_headers):
        """Staff cannot GET reorder suggestions - should get 403"""
        response = requests.get(f"{API_URL}/reorder/suggestions", headers=staff_headers)
        assert response.status_code == 403, f"Expected 403 for staff GET reorder suggestions, got {response.status_code}: {response.text}"
        print("Staff correctly blocked from GET /reorder/suggestions (403)")
    
    def test_staff_cannot_post_purchase_orders(self, staff_headers):
        """Staff cannot POST purchase orders - should get 403"""
        test_po = {
            "supplier_id": "test",
            "supplier_name": "Test Supplier",
            "items": [],
            "notes": "Test"
        }
        response = requests.post(f"{API_URL}/reorder/purchase-orders", json=test_po, headers=staff_headers)
        assert response.status_code == 403, f"Expected 403 for staff POST purchase-orders, got {response.status_code}: {response.text}"
        print("Staff correctly blocked from POST /reorder/purchase-orders (403)")
    
    def test_staff_cannot_get_purchase_orders(self, staff_headers):
        """Staff cannot GET purchase orders - should get 403"""
        response = requests.get(f"{API_URL}/reorder/purchase-orders", headers=staff_headers)
        assert response.status_code == 403, f"Expected 403 for staff GET purchase-orders, got {response.status_code}: {response.text}"
        print("Staff correctly blocked from GET /reorder/purchase-orders (403)")


class TestStaffAllowedEndpoints:
    """Test that staff CAN access non-restricted endpoints"""
    
    def test_staff_can_get_products(self, staff_headers):
        """Staff can GET products (read-only)"""
        response = requests.get(f"{API_URL}/products", headers=staff_headers)
        assert response.status_code == 200, f"Staff GET products failed: {response.text}"
        print("Staff can read products (200)")
    
    def test_staff_can_get_sessions(self, staff_headers):
        """Staff can GET sessions"""
        response = requests.get(f"{API_URL}/sessions", headers=staff_headers)
        assert response.status_code == 200, f"Staff GET sessions failed: {response.text}"
        print("Staff can read sessions (200)")
    
    def test_staff_can_get_dashboard_kpis(self, staff_headers):
        """Staff can GET dashboard KPIs"""
        response = requests.get(f"{API_URL}/dashboard/kpis", headers=staff_headers)
        assert response.status_code == 200, f"Staff GET dashboard/kpis failed: {response.text}"
        print("Staff can read dashboard KPIs (200)")


# ============ AUTO-REORDER FEATURE TESTS ============

class TestReorderSuggestions:
    """Test reorder suggestions endpoint"""
    
    def test_get_reorder_suggestions_returns_low_stock(self, owner_headers):
        """GET /reorder/suggestions returns products below reorder point"""
        response = requests.get(f"{API_URL}/reorder/suggestions", headers=owner_headers)
        assert response.status_code == 200
        suggestions = response.json()
        assert isinstance(suggestions, list)
        
        # Verify structure of suggestions
        if len(suggestions) > 0:
            s = suggestions[0]
            assert "product_id" in s
            assert "product_name" in s
            assert "current_stock" in s
            assert "reorder_point" in s
            assert "qty_needed" in s
            assert "unit_cost" in s
            assert "estimated_cost" in s
            
            # Verify logic: current_stock < reorder_point
            assert s["current_stock"] < s["reorder_point"], \
                f"Suggestion should have current_stock < reorder_point: {s['current_stock']} < {s['reorder_point']}"
            
            print(f"Found {len(suggestions)} products needing reorder")
            for sug in suggestions[:3]:
                print(f"  - {sug['product_name']}: stock={sug['current_stock']}, reorder_pt={sug['reorder_point']}, need={sug['qty_needed']}")


class TestPurchaseOrderWorkflow:
    """Test purchase order CRUD and status workflow"""
    
    def test_create_purchase_order(self, owner_headers):
        """POST /reorder/purchase-orders creates a PO"""
        po_data = {
            "supplier_id": "test-supplier-id",
            "supplier_name": "Test Supplier",
            "items": [
                {
                    "product_id": "test-product-1",
                    "product_name": "Test Product",
                    "qty_needed": 20,
                    "unit_cost": 5.50,
                    "estimated_cost": 110.00
                }
            ],
            "notes": "TEST_PO for automated testing"
        }
        response = requests.post(f"{API_URL}/reorder/purchase-orders", json=po_data, headers=owner_headers)
        assert response.status_code == 200, f"Create PO failed: {response.text}"
        
        po = response.json()
        assert "id" in po
        assert "po_number" in po
        assert po["status"] == "pending"
        assert po["supplier_name"] == "Test Supplier"
        assert po["total_estimated"] == 110.00
        
        print(f"Created PO: {po['po_number']} with status={po['status']}")
        
        # Store for cleanup
        return po["id"]
    
    def test_get_purchase_orders(self, owner_headers):
        """GET /reorder/purchase-orders lists POs"""
        response = requests.get(f"{API_URL}/reorder/purchase-orders", headers=owner_headers)
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"Found {len(orders)} purchase orders")
        
        if len(orders) > 0:
            po = orders[0]
            assert "id" in po
            assert "po_number" in po
            assert "status" in po
            assert "items" in po
    
    def test_update_po_status_to_ordered(self, owner_headers):
        """PUT /reorder/purchase-orders/{id}/status updates status to ordered"""
        # First create a PO
        po_data = {
            "supplier_id": "test-supplier",
            "supplier_name": "Status Test Supplier",
            "items": [{"product_id": "p1", "product_name": "P1", "qty_needed": 5, "unit_cost": 2, "estimated_cost": 10}],
            "notes": "TEST_Status_Update"
        }
        create_resp = requests.post(f"{API_URL}/reorder/purchase-orders", json=po_data, headers=owner_headers)
        assert create_resp.status_code == 200
        po_id = create_resp.json()["id"]
        
        # Update status to ordered
        response = requests.put(f"{API_URL}/reorder/purchase-orders/{po_id}/status?new_status=ordered", headers=owner_headers)
        assert response.status_code == 200, f"Update status failed: {response.text}"
        
        # Verify status changed
        get_resp = requests.get(f"{API_URL}/reorder/purchase-orders", headers=owner_headers)
        orders = get_resp.json()
        updated_po = next((o for o in orders if o["id"] == po_id), None)
        assert updated_po is not None
        assert updated_po["status"] == "ordered", f"Expected status 'ordered', got '{updated_po['status']}'"
        
        print(f"PO status updated to 'ordered'")
        
        # Cleanup
        requests.delete(f"{API_URL}/reorder/purchase-orders/{po_id}", headers=owner_headers)
    
    def test_update_po_status_to_received(self, owner_headers):
        """PUT /reorder/purchase-orders/{id}/status updates status to received"""
        # Create and move to ordered first
        po_data = {
            "supplier_id": "test-supplier",
            "supplier_name": "Received Test Supplier",
            "items": [{"product_id": "p1", "product_name": "P1", "qty_needed": 5, "unit_cost": 2, "estimated_cost": 10}],
            "notes": "TEST_Received"
        }
        create_resp = requests.post(f"{API_URL}/reorder/purchase-orders", json=po_data, headers=owner_headers)
        po_id = create_resp.json()["id"]
        
        # Move to ordered
        requests.put(f"{API_URL}/reorder/purchase-orders/{po_id}/status?new_status=ordered", headers=owner_headers)
        
        # Move to received
        response = requests.put(f"{API_URL}/reorder/purchase-orders/{po_id}/status?new_status=received", headers=owner_headers)
        assert response.status_code == 200
        
        # Verify
        get_resp = requests.get(f"{API_URL}/reorder/purchase-orders", headers=owner_headers)
        orders = get_resp.json()
        updated_po = next((o for o in orders if o["id"] == po_id), None)
        assert updated_po["status"] == "received"
        
        print(f"PO status updated to 'received'")
        
        # Cleanup
        requests.delete(f"{API_URL}/reorder/purchase-orders/{po_id}", headers=owner_headers)
    
    def test_delete_purchase_order(self, owner_headers):
        """DELETE /reorder/purchase-orders/{id} removes PO"""
        # Create a PO
        po_data = {
            "supplier_id": "test-supplier",
            "supplier_name": "Delete Test Supplier",
            "items": [],
            "notes": "TEST_Delete"
        }
        create_resp = requests.post(f"{API_URL}/reorder/purchase-orders", json=po_data, headers=owner_headers)
        po_id = create_resp.json()["id"]
        
        # Delete it
        response = requests.delete(f"{API_URL}/reorder/purchase-orders/{po_id}", headers=owner_headers)
        assert response.status_code == 200, f"Delete PO failed: {response.text}"
        
        # Verify it's gone
        get_resp = requests.get(f"{API_URL}/reorder/purchase-orders", headers=owner_headers)
        orders = get_resp.json()
        deleted_po = next((o for o in orders if o["id"] == po_id), None)
        assert deleted_po is None, "PO should be deleted"
        
        print("PO successfully deleted")


class TestInvalidStatusUpdate:
    """Test invalid status transitions"""
    
    def test_invalid_status_returns_400(self, owner_headers):
        """PUT with invalid status returns 400"""
        # Create a PO
        po_data = {
            "supplier_id": "test",
            "supplier_name": "Invalid Status Test",
            "items": [],
            "notes": "TEST_Invalid"
        }
        create_resp = requests.post(f"{API_URL}/reorder/purchase-orders", json=po_data, headers=owner_headers)
        po_id = create_resp.json()["id"]
        
        # Try invalid status
        response = requests.put(f"{API_URL}/reorder/purchase-orders/{po_id}/status?new_status=invalid_status", headers=owner_headers)
        assert response.status_code == 400, f"Expected 400 for invalid status, got {response.status_code}"
        
        # Cleanup
        requests.delete(f"{API_URL}/reorder/purchase-orders/{po_id}", headers=owner_headers)
        print("Invalid status correctly rejected (400)")


# ============ CLEANUP ============

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(owner_token):
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
    
    # Cleanup test POs
    try:
        orders = requests.get(f"{API_URL}/reorder/purchase-orders", headers=headers).json()
        for po in orders:
            if "TEST_" in po.get("notes", ""):
                requests.delete(f"{API_URL}/reorder/purchase-orders/{po['id']}", headers=headers)
    except:
        pass
    
    # Cleanup test products
    try:
        products = requests.get(f"{API_URL}/products", headers=headers).json()
        for p in products:
            if p.get("name", "").startswith("TEST_"):
                requests.delete(f"{API_URL}/products/{p['id']}", headers=headers)
    except:
        pass
    
    # Cleanup test suppliers
    try:
        suppliers = requests.get(f"{API_URL}/suppliers", headers=headers).json()
        for s in suppliers:
            if s.get("name", "").startswith("TEST_"):
                requests.delete(f"{API_URL}/suppliers/{s['id']}", headers=headers)
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
