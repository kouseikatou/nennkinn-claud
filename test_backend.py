#!/usr/bin/env python3
import requests
import json
import sys

BASE_URL = "http://localhost:3001"

def test_endpoint(endpoint, method="GET", data=None):
    """Test API endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🧪 Testing {method} {url}")
        
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        return response.status_code == 200 or response.status_code == 201
        
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection failed - Server not running on {BASE_URL}")
        return False
    except requests.exceptions.Timeout:
        print(f"   ❌ Timeout")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("🚀 Backend API Testing")
    print("=" * 50)
    
    # Test basic endpoints
    tests = [
        ("/", "GET"),
        ("/health", "GET"),
        ("/api/surveys/1/basic", "POST", {"data": {"test": "data"}, "status": "draft"}),
        ("/api/surveys/1/basic", "GET"),
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        endpoint = test[0]
        method = test[1]
        data = test[2] if len(test) > 2 else None
        
        if test_endpoint(endpoint, method, data):
            passed += 1
            print("   ✅ PASSED")
        else:
            print("   ❌ FAILED")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Check the server logs.")
        sys.exit(1)

if __name__ == "__main__":
    main()