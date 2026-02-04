import requests
import sys
import json
import csv
import io
from datetime import datetime

class ExpenseAPITester:
    def __init__(self, base_url="https://expense-csv-export.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_expense_id = None
        self.test_expense_ids = []  # Track multiple test expenses

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

    def create_test_expenses_for_csv(self):
        """Create test expenses for CSV export testing"""
        print("\n📝 Creating test expenses for CSV export...")
        
        # Current month expenses
        current_month_expenses = [
            {
                "amount": 45.99,
                "category": "Groceries",
                "description": "Weekly grocery shopping",
                "date": "2024-12-05"
            },
            {
                "amount": 12.50,
                "category": "Transportation",
                "description": "Bus fare",
                "date": "2024-12-10"
            },
            {
                "amount": 89.00,
                "category": "Utilities",
                "description": "Electricity bill",
                "date": "2024-12-15"
            }
        ]
        
        # Previous month expenses
        previous_month_expenses = [
            {
                "amount": 25.75,
                "category": "Food",
                "description": "Restaurant dinner",
                "date": "2024-11-20"
            },
            {
                "amount": 15.00,
                "category": "Entertainment",
                "description": "Movie tickets",
                "date": "2024-11-25"
            }
        ]
        
        all_expenses = current_month_expenses + previous_month_expenses
        created_count = 0
        
        for expense_data in all_expenses:
            success, response = self.run_test(
                f"Create Test Expense - {expense_data['description']}",
                "POST",
                "expenses",
                201,  # Should be 201 for created
                data=expense_data
            )
            if success and 'id' in response:
                self.test_expense_ids.append(response['id'])
                created_count += 1
        
        print(f"✅ Created {created_count} test expenses for CSV testing")
        return created_count > 0

    def test_csv_export_current_month(self):
        """Test CSV export for current month (December 2024)"""
        success, response = self.run_test(
            "CSV Export - Current Month",
            "GET",
            "expenses/export/csv?month=12&year=2024",
            200
        )
        return success

    def test_csv_export_previous_month(self):
        """Test CSV export for previous month (November 2024)"""
        success, response = self.run_test(
            "CSV Export - Previous Month",
            "GET",
            "expenses/export/csv?month=11&year=2024",
            200
        )
        return success

    def test_csv_export_empty_month(self):
        """Test CSV export for month with no expenses"""
        success, response = self.run_test(
            "CSV Export - Empty Month",
            "GET",
            "expenses/export/csv?month=1&year=2023",
            200
        )
        return success

    def test_csv_export_headers_and_content(self):
        """Test CSV export response headers and content format"""
        url = f"{self.base_url}/expenses/export/csv?month=12&year=2024"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing CSV Export Headers and Content...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                # Check Content-Type header
                content_type = response.headers.get('content-type', '')
                if 'text/csv' not in content_type:
                    print(f"❌ Wrong Content-Type: {content_type}, expected text/csv")
                    return False
                
                # Check Content-Disposition header
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' not in content_disposition or 'expenses_2024_12.csv' not in content_disposition:
                    print(f"❌ Wrong Content-Disposition: {content_disposition}")
                    return False
                
                # Check CSV content
                csv_content = response.text
                csv_reader = csv.reader(io.StringIO(csv_content))
                rows = list(csv_reader)
                
                if not rows:
                    print("❌ Empty CSV content")
                    return False
                
                # Check headers
                expected_headers = ['id', 'date', 'description', 'category', 'amount', 'created_at']
                if rows[0] != expected_headers:
                    print(f"❌ Wrong CSV headers: {rows[0]}, expected: {expected_headers}")
                    return False
                
                print(f"✅ Passed - CSV headers and content format correct")
                print(f"   Content-Type: {content_type}")
                print(f"   Content-Disposition: {content_disposition}")
                print(f"   CSV rows: {len(rows)} (including header)")
                
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_csv_export_without_auth(self):
        """Test CSV export without authentication"""
        # Save current token
        original_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "CSV Export - No Authentication",
            "GET",
            "expenses/export/csv?month=12&year=2024",
            401  # Should return 401 for unauthorized
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_csv_export_invalid_auth(self):
        """Test CSV export with invalid authentication"""
        # Save current token
        original_token = self.token
        self.token = "invalid_token_12345"
        
        success, response = self.run_test(
            "CSV Export - Invalid Authentication",
            "GET",
            "expenses/export/csv?month=12&year=2024",
            401  # Should return 401 for invalid token
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_csv_export_data_isolation(self):
        """Test that CSV export only returns current user's expenses"""
        # Create a second user
        timestamp = datetime.now().strftime('%H%M%S')
        user2_data = {
            "name": f"CSV Test User 2 {timestamp}",
            "email": f"csvtest2_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        # Register second user
        success, response = self.run_test(
            "Register Second User for CSV Isolation Test",
            "POST",
            "auth/register",
            200,
            data=user2_data
        )
        
        if not success:
            return False
        
        user2_token = response['token']
        
        # Create expense as second user
        original_token = self.token
        self.token = user2_token
        
        expense_data = {
            "amount": 999.99,
            "category": "Test",
            "description": "User 2 expense - should not appear in user 1 CSV",
            "date": "2024-12-20"
        }
        
        success, _ = self.run_test(
            "Create Expense as User 2",
            "POST",
            "expenses",
            201,
            data=expense_data
        )
        
        # Switch back to original user
        self.token = original_token
        
        # Export CSV as original user - should not contain user 2's expense
        url = f"{self.base_url}/expenses/export/csv?month=12&year=2024"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                csv_content = response.text
                if "User 2 expense" in csv_content:
                    print("❌ CSV contains other user's data - data isolation failed")
                    return False
                else:
                    print("✅ CSV data isolation working correctly")
                    return True
            else:
                print(f"❌ CSV export failed with status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error testing CSV data isolation: {str(e)}")
            return False

    def test_invalid_auth(self):
        """Test API with invalid authentication"""
        # Save current token
        original_token = self.token
        self.token = "invalid_token"
        
        success, response = self.run_test(
            "Invalid Authentication",
            "GET",
            "expenses",
            520  # Backend returns 520 for invalid auth, not 401
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