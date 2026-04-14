#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class RestaurantAPITester:
    def __init__(self, base_url="https://kitchen-analytics-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_products_endpoints(self):
        """Test all product-related endpoints"""
        print("\n📦 TESTING PRODUCTS ENDPOINTS")
        
        # Get all products
        success, products = self.run_test("Get All Products", "GET", "products", 200)
        if not success:
            return False
            
        print(f"   Found {len(products)} products")
        
        # Verify we have the expected 10 products
        if len(products) != 10:
            print(f"❌ Expected 10 products, found {len(products)}")
            return False
        
        # Test getting a specific product
        if products:
            product_id = products[0]['id']
            success, product = self.run_test("Get Single Product", "GET", f"products/{product_id}", 200)
            if success:
                print(f"   Product: {product.get('name', 'Unknown')} - ${product.get('price', 0)}")
        
        return True

    def test_markets_endpoints(self):
        """Test all market-related endpoints"""
        print("\n🏪 TESTING MARKETS ENDPOINTS")
        
        # Get all markets
        success, markets = self.run_test("Get All Markets", "GET", "markets", 200)
        if not success:
            return False
            
        print(f"   Found {len(markets)} markets")
        
        # Verify we have the expected 5 markets
        if len(markets) != 5:
            print(f"❌ Expected 5 markets, found {len(markets)}")
            return False
            
        return True

    def test_sessions_endpoints(self):
        """Test all session-related endpoints"""
        print("\n📊 TESTING SESSIONS ENDPOINTS")
        
        # Get all sessions
        success, sessions = self.run_test("Get All Sessions", "GET", "sessions", 200)
        if not success:
            return False
            
        print(f"   Found {len(sessions)} sessions")
        
        # Verify we have the expected 11 sessions
        if len(sessions) != 11:
            print(f"❌ Expected 11 sessions, found {len(sessions)}")
            return False
        
        # Test getting a specific session
        if sessions:
            session_id = sessions[0]['id']
            success, session = self.run_test("Get Single Session", "GET", f"sessions/{session_id}", 200)
            if success:
                print(f"   Session: {session.get('market_name', 'Unknown')} - ${session.get('calculated_sales', 0)}")
        
        return True

    def test_dashboard_endpoints(self):
        """Test dashboard and analytics endpoints"""
        print("\n📈 TESTING DASHBOARD ENDPOINTS")
        
        # Test KPIs endpoint
        success, kpis = self.run_test("Dashboard KPIs", "GET", "dashboard/kpis", 200)
        if not success:
            return False
            
        # Verify expected KPI values
        expected_sales = 12008
        expected_profit = 9075
        expected_sessions = 11
        expected_cogs = 24.4
        
        actual_sales = kpis.get('total_sales', 0)
        actual_profit = kpis.get('total_profit', 0)
        actual_sessions = kpis.get('session_count', 0)
        actual_cogs = kpis.get('avg_cogs_percent', 0)
        
        print(f"   Total Sales: ${actual_sales} (expected ~${expected_sales})")
        print(f"   Gross Profit: ${actual_profit} (expected ~${expected_profit})")
        print(f"   Sessions: {actual_sessions} (expected {expected_sessions})")
        print(f"   Avg COGS: {actual_cogs}% (expected ~{expected_cogs}%)")
        
        # Check if values are close to expected (within 10% tolerance)
        sales_ok = abs(actual_sales - expected_sales) / expected_sales < 0.1
        profit_ok = abs(actual_profit - expected_profit) / expected_profit < 0.1
        sessions_ok = actual_sessions == expected_sessions
        cogs_ok = abs(actual_cogs - expected_cogs) / expected_cogs < 0.1
        
        if not all([sales_ok, profit_ok, sessions_ok, cogs_ok]):
            print("❌ KPI values don't match expected ranges")
            return False
        
        # Test other dashboard endpoints
        self.run_test("Sales by Month", "GET", "dashboard/sales-by-month", 200)
        self.run_test("Product Performance", "GET", "dashboard/product-performance", 200)
        self.run_test("Margin Watch", "GET", "dashboard/margin-watch", 200)
        
        return True

    def test_stock_planner_endpoint(self):
        """Test stock planner endpoint"""
        print("\n📦 TESTING STOCK PLANNER")
        
        # Test with default parameters
        success, stock_plan = self.run_test("Stock Planner Default", "GET", "stock-planner", 200, params={"target_revenue": 1000})
        if not success:
            return False
            
        if 'stock_plan' in stock_plan:
            print(f"   Stock plan has {len(stock_plan['stock_plan'])} products")
        
        return True

    def test_allocation_endpoints(self):
        """Test allocation tool endpoints"""
        print("\n💰 TESTING ALLOCATION TOOL")
        
        # Test getting allocation settings
        success, settings = self.run_test("Get Allocation Settings", "GET", "allocation/settings", 200)
        if not success:
            return False
            
        # Test allocation calculation
        success, calc = self.run_test("Calculate Allocation", "GET", "allocation/calculate", 200, params={"week_sales": 2000})
        if not success:
            return False
            
        if 'allocations' in calc:
            allocations = calc['allocations']
            print(f"   Owner Pay: ${allocations.get('owner_pay', 0)}")
            print(f"   Growth: ${allocations.get('growth', 0)}")
            print(f"   Emergency: ${allocations.get('emergency', 0)}")
            print(f"   Buffer: ${allocations.get('buffer', 0)}")
        
        return True

    def test_inventory_endpoint(self):
        """Test inventory endpoint"""
        print("\n📋 TESTING INVENTORY")
        
        success, inventory = self.run_test("Get Inventory", "GET", "inventory", 200)
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Restaurant Management API Tests")
        print(f"Testing against: {self.base_url}")
        
        # Test all endpoints
        tests = [
            self.test_root_endpoint,
            self.test_products_endpoints,
            self.test_markets_endpoints,
            self.test_sessions_endpoints,
            self.test_dashboard_endpoints,
            self.test_stock_planner_endpoint,
            self.test_allocation_endpoints,
            self.test_inventory_endpoint
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
                self.failed_tests.append({'name': test.__name__, 'error': str(e)})
        
        # Print summary
        print(f"\n📊 TEST SUMMARY")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
                print(f"  - {failure['name']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = RestaurantAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())