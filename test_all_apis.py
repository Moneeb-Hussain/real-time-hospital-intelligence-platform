import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_result(name, response, error=None):
    print(f"\n{'='*60}")
    print(f"🧪 {name}")
    print(f"{'='*60}")
    if error:
        print(f"❌ ERROR: {error}")
    else:
        print(f"✅ Status: {response.status_code}")
        try:
            data = response.json()
            print(f"📊 Response: {json.dumps(data, indent=2)[:500]}...")
        except:
            print(f"📊 Response: {response.text[:200]}...")

def test_all_apis():
    print("\n" + "="*60)
    print("🏥 HOSPITAL INTELLIGENCE PLATFORM - API TEST SUITE")
    print("="*60)
    print(f"📡 Base URL: {BASE_URL}\n")
    
    results = []
    
    # 1. Health Check
    print("\n" + "="*60)
    print("1️⃣ HEALTH CHECK")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print_result("Health Check", response)
        results.append(("Health Check", response.status_code == 200))
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        results.append(("Health Check", False))
    
    # 2. Get All Resources
    print("\n" + "="*60)
    print("2️⃣ GET ALL RESOURCES")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/resources", timeout=5)
        print_result("Get Resources", response)
        results.append(("Get Resources", response.status_code == 200))
        if response.status_code == 200:
            resources = response.json()
            print(f"📊 Total Resources: {len(resources)}")
    except Exception as e:
        print(f"❌ Get Resources Failed: {e}")
        results.append(("Get Resources", False))
    
    # 3. Create a New Resource
    print("\n" + "="*60)
    print("3️⃣ CREATE RESOURCE (POST)")
    print("="*60)
    try:
        new_resource = {
            "resource_type": "bed",
            "sub_type": "ICU",
            "name": "ICU Bed #99",
            "is_available": True
        }
        response = requests.post(
            f"{BASE_URL}/resources",
            json=new_resource,
            timeout=5
        )
        print_result("Create Resource", response)
        results.append(("Create Resource", response.status_code == 200))
        
        # Store the created resource ID for later tests
        resource_id = None
        if response.status_code == 200:
            data = response.json()
            if data.get('data') and len(data['data']) > 0:
                resource_id = data['data'][0].get('id')
                print(f"🆔 Created Resource ID: {resource_id}")
    except Exception as e:
        print(f"❌ Create Resource Failed: {e}")
        results.append(("Create Resource", False))
        resource_id = None
    
    # 4. Get Specific Resource (if we have an ID)
    if resource_id:
        print("\n" + "="*60)
        print("4️⃣ GET SPECIFIC RESOURCE")
        print("="*60)
        try:
            response = requests.get(f"{BASE_URL}/resources/{resource_id}", timeout=5)
            print_result("Get Specific Resource", response)
            results.append(("Get Specific Resource", response.status_code == 200))
        except Exception as e:
            print(f"❌ Get Specific Resource Failed: {e}")
            results.append(("Get Specific Resource", False))
    
    # 5. Update Resource
    print("\n" + "="*60)
    print("5️⃣ UPDATE RESOURCE (PATCH)")
    print("="*60)
    try:
        # Get any resource ID
        get_response = requests.get(f"{BASE_URL}/resources", timeout=5)
        if get_response.status_code == 200:
            resources = get_response.json()
            if resources and len(resources) > 0:
                test_id = resources[0].get('id')
                if test_id:
                    update_data = {"is_available": False}
                    response = requests.patch(
                        f"{BASE_URL}/resources/{test_id}",
                        json=update_data,
                        timeout=5
                    )
                    print_result("Update Resource", response)
                    results.append(("Update Resource", response.status_code == 200))
                else:
                    print("⚠️ No resource ID found for update test")
                    results.append(("Update Resource", False))
            else:
                print("⚠️ No resources found for update test")
                results.append(("Update Resource", False))
    except Exception as e:
        print(f"❌ Update Resource Failed: {e}")
        results.append(("Update Resource", False))
    
    # 6. Validate Recommendation
    print("\n" + "="*60)
    print("6️⃣ VALIDATE RECOMMENDATION")
    print("="*60)
    try:
        # Get a resource ID for validation
        get_response = requests.get(f"{BASE_URL}/resources", timeout=5)
        if get_response.status_code == 200:
            resources = get_response.json()
            if resources and len(resources) > 0:
                validate_id = resources[0].get('id')
                validate_data = {
                    "patient_id": "test-patient-123",
                    "recommended_resource_id": validate_id,
                    "recommended_unit": "ICU"
                }
                response = requests.post(
                    f"{BASE_URL}/backend/validate-recommendation",
                    json=validate_data,
                    timeout=5
                )
                print_result("Validate Recommendation", response)
                results.append(("Validate Recommendation", response.status_code == 200))
            else:
                print("⚠️ No resources found for validation test")
                results.append(("Validate Recommendation", False))
    except Exception as e:
        print(f"❌ Validate Recommendation Failed: {e}")
        results.append(("Validate Recommendation", False))
    
    # 7. Dashboard (if available)
    print("\n" + "="*60)
    print("7️⃣ DASHBOARD")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/api/dashboard", timeout=5)
        print_result("Dashboard", response)
        results.append(("Dashboard", response.status_code == 200))
    except Exception as e:
        print(f"⚠️ Dashboard not available: {e}")
        results.append(("Dashboard", False))
    
    # 8. Root Endpoint
    print("\n" + "="*60)
    print("8️⃣ ROOT ENDPOINT")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print_result("Root", response)
        results.append(("Root", response.status_code == 200))
    except Exception as e:
        print(f"❌ Root Endpoint Failed: {e}")
        results.append(("Root", False))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    total = len(results)
    passed = sum(1 for _, status in results if status)
    failed = total - passed
    
    print(f"\n📈 Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    print("\n📋 DETAILED RESULTS:")
    for name, status in results:
        icon = "✅" if status else "❌"
        print(f"   {icon} {name}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Your API is working perfectly!")
    else:
        print(f"\n⚠️ {failed} test(s) failed. Please check the errors above.")
    
    print("\n" + "="*60)
    print("🏁 TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_all_apis()