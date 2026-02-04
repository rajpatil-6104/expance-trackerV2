import requests
import sys
import json
from datetime import datetime

class ExpenseAPITester:
    def __init__(self, base_url="https://expensify-38.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_expense_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {response['user']['name']} ({response['user']['email']})")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "name": f"Login Test User {timestamp}",
            "email": f"logintest{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        # Register first
        success, _ = self.run_test(
            "Pre-register for Login Test",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not success:
            return False
            
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        if success and 'token' in response:
            # Update token for subsequent tests
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_create_expense(self):
        """Test creating an expense"""
        expense_data = {
            "amount": 25.50,
            "category": "Food",
            "description": "Lunch at restaurant",
            "date": "2024-01-15"
        }
        success, response = self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,  # Backend returns 200, not 201
            data=expense_data
        )
        if success and 'id' in response:
            self.created_expense_id = response['id']
            return True
        return False

    def test_get_expenses(self):
        """Test getting all expenses"""
        success, response = self.run_test(
            "Get All Expenses",
            "GET",
            "expenses",
            200
        )
        return success and isinstance(response, list)

    def test_get_single_expense(self):
        """Test getting a single expense"""
        if not self.created_expense_id:
            print("❌ No expense ID available for single expense test")
            return False
            
        success, response = self.run_test(
            "Get Single Expense",
            "GET",
            f"expenses/{self.created_expense_id}",
            200
        )
        return success and 'id' in response

    def test_update_expense(self):
        """Test updating an expense"""
        if not self.created_expense_id:
            print("❌ No expense ID available for update test")
            return False
            
        update_data = {
            "amount": 30.00,
            "category": "Food",
            "description": "Updated lunch expense",
            "date": "2024-01-15"
        }
        success, response = self.run_test(
            "Update Expense",
            "PUT",
            f"expenses/{self.created_expense_id}",
            200,
            data=update_data
        )
        return success and response.get('amount') == 30.00

    def test_analytics_summary(self):
        """Test analytics summary endpoint"""
        success, response = self.run_test(
            "Analytics Summary",
            "GET",
            "analytics/summary",
            200
        )
        return success and 'total_expenses' in response and 'expense_count' in response

    def test_category_filtering(self):
        """Test expense filtering by category"""
        success, response = self.run_test(
            "Filter Expenses by Category",
            "GET",
            "expenses?category=Food",
            200
        )
        return success and isinstance(response, list)

    def test_date_filtering(self):
        """Test expense filtering by date range"""
        success, response = self.run_test(
            "Filter Expenses by Date Range",
            "GET",
            "expenses?start_date=2024-01-01&end_date=2024-12-31",
            200
        )
        return success and isinstance(response, list)

    def test_delete_expense(self):
        """Test deleting an expense"""
        if not self.created_expense_id:
            print("❌ No expense ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Expense",
            "DELETE",
            f"expenses/{self.created_expense_id}",
            200
        )
        return success

    def test_invalid_auth(self):
        """Test API with invalid authentication"""
        # Save current token
        original_token = self.token
        self.token = "invalid_token"
        
        success, response = self.run_test(
            "Invalid Authentication",
            "GET",
            "expenses",
            401
        )
        
        # Restore original token
        self.token = original_token
        return success

def main():
    print("🚀 Starting Expense Management API Tests")
    print("=" * 50)
    
    tester = ExpenseAPITester()
    
    # Test sequence
    tests = [
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("Create Expense", tester.test_create_expense),
        ("Get All Expenses", tester.test_get_expenses),
        ("Get Single Expense", tester.test_get_single_expense),
        ("Update Expense", tester.test_update_expense),
        ("Analytics Summary", tester.test_analytics_summary),
        ("Category Filtering", tester.test_category_filtering),
        ("Date Filtering", tester.test_date_filtering),
        ("Invalid Authentication", tester.test_invalid_auth),
        ("Delete Expense", tester.test_delete_expense),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())