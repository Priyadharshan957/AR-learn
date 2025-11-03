import requests
import sys
import json
from datetime import datetime

class ARLearningAPITester:
    def __init__(self, base_url="https://learnmodel.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.student_user_id = None
        self.admin_user_id = None
        self.subject_id = None
        self.model_id = None
        self.question_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
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
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")

            return success, response.json() if response.content and success else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_student_registration(self):
        """Test student registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        student_data = {
            "name": f"Test Student {timestamp}",
            "email": f"student{timestamp}@test.com",
            "password": "testpass123",
            "role": "student"
        }
        
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            data=student_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.student_user_id = response['user']['id']
            return True
        return False

    def test_admin_registration(self):
        """Test admin registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        admin_data = {
            "name": f"Test Admin {timestamp}",
            "email": f"admin{timestamp}@test.com",
            "password": "adminpass123",
            "role": "admin"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user']['id']
            return True
        return False

    def test_student_login(self):
        """Test student login"""
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"student{timestamp}@test.com",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        return success

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.token:
            print("❌ No token available for user test")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_initialize_sample_data(self):
        """Test initialize sample data (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Initialize Sample Data",
            "POST",
            "admin/initialize-data",
            200,
            data={},
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def test_get_subjects(self):
        """Test get subjects"""
        if not self.token:
            print("❌ No token available")
            return False
            
        success, response = self.run_test(
            "Get Subjects",
            "GET",
            "subjects",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success and response and len(response) > 0:
            self.subject_id = response[0]['id']
            print(f"   Found {len(response)} subjects")
        return success

    def test_create_subject(self):
        """Test create subject (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        subject_data = {
            "name": "Test Physics",
            "description": "Test physics subject for automated testing",
            "category": "physics"
        }
        
        success, response = self.run_test(
            "Create Subject",
            "POST",
            "subjects",
            200,
            data=subject_data,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and 'id' in response:
            self.subject_id = response['id']
        return success

    def test_get_models(self):
        """Test get models"""
        if not self.token:
            print("❌ No token available")
            return False
            
        success, response = self.run_test(
            "Get Models",
            "GET",
            "models",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success and response and len(response) > 0:
            self.model_id = response[0]['id']
            print(f"   Found {len(response)} models")
        return success

    def test_create_model(self):
        """Test create 3D model (admin only)"""
        if not self.admin_token or not self.subject_id:
            print("❌ No admin token or subject_id available")
            return False
            
        model_data = {
            "title": "Test Model",
            "description": "Test 3D model for automated testing",
            "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf",
            "subject_id": self.subject_id,
            "labels": ["Test", "Automation"]
        }
        
        success, response = self.run_test(
            "Create 3D Model",
            "POST",
            "models",
            200,
            data=model_data,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and 'id' in response:
            self.model_id = response['id']
        return success

    def test_get_model_by_id(self):
        """Test get specific model"""
        if not self.token or not self.model_id:
            print("❌ No token or model_id available")
            return False
            
        success, response = self.run_test(
            "Get Model by ID",
            "GET",
            f"models/{self.model_id}",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return success

    def test_create_question(self):
        """Test create question (admin only)"""
        if not self.admin_token or not self.subject_id or not self.model_id:
            print("❌ Missing required IDs for question creation")
            return False
            
        question_data = {
            "subject_id": self.subject_id,
            "model_id": self.model_id,
            "question_text": "What is this test model?",
            "options": ["A duck", "A car", "A house", "A tree"],
            "correct_answer": 0,
            "difficulty": "easy"
        }
        
        success, response = self.run_test(
            "Create Question",
            "POST",
            "questions",
            200,
            data=question_data,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and 'id' in response:
            self.question_id = response['id']
        return success

    def test_get_questions_for_model(self):
        """Test get questions for model"""
        if not self.token or not self.model_id:
            print("❌ No token or model_id available")
            return False
            
        success, response = self.run_test(
            "Get Questions for Model",
            "GET",
            f"questions/{self.model_id}",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success and response:
            print(f"   Found {len(response)} questions")
        return success

    def test_submit_assessment(self):
        """Test submit assessment"""
        if not self.token or not self.model_id or not self.subject_id or not self.question_id:
            print("❌ Missing required IDs for assessment submission")
            return False
            
        submission_data = {
            "question_id": self.question_id,
            "selected_answer": 0
        }
        
        success, response = self.run_test(
            "Submit Assessment",
            "POST",
            f"assessments/submit?model_id={self.model_id}&subject_id={self.subject_id}&time_spent=30",
            200,
            data=submission_data,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success:
            print(f"   Assessment result: {'Correct' if response.get('is_correct') else 'Incorrect'}")
            print(f"   Next difficulty: {response.get('next_difficulty', 'N/A')}")
        return success

    def test_get_performance(self):
        """Test get performance stats"""
        if not self.token:
            print("❌ No token available")
            return False
            
        success, response = self.run_test(
            "Get Performance Stats",
            "GET",
            "performance",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success:
            print(f"   Total assessments: {response.get('total_assessments', 0)}")
            print(f"   Accuracy: {response.get('accuracy', 0) * 100:.1f}%")
        return success

    def test_get_leaderboard(self):
        """Test get leaderboard"""
        if not self.token:
            print("❌ No token available")
            return False
            
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success and response:
            print(f"   Leaderboard entries: {len(response)}")
        return success

def main():
    print("🚀 Starting AR Learning System API Tests")
    print("=" * 50)
    
    tester = ARLearningAPITester()
    
    # Test sequence
    tests = [
        ("Student Registration", tester.test_student_registration),
        ("Admin Registration", tester.test_admin_registration),
        ("Student Login", tester.test_student_login),
        ("Get Current User", tester.test_get_current_user),
        ("Initialize Sample Data", tester.test_initialize_sample_data),
        ("Get Subjects", tester.test_get_subjects),
        ("Create Subject", tester.test_create_subject),
        ("Get Models", tester.test_get_models),
        ("Create 3D Model", tester.test_create_model),
        ("Get Model by ID", tester.test_get_model_by_id),
        ("Create Question", tester.test_create_question),
        ("Get Questions for Model", tester.test_get_questions_for_model),
        ("Submit Assessment", tester.test_submit_assessment),
        ("Get Performance Stats", tester.test_get_performance),
        ("Get Leaderboard", tester.test_get_leaderboard),
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
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())