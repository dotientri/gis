
import requests
import hashlib

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def test_login(identifier, password):
    """Tests the login endpoint with given credentials"""
    url = "http://127.0.0.1:8000/api/auth/login/"
    payload = {
        "ten_dang_nhap": identifier,
        "mat_khau": password
    }
    
    print(f"--- Testing login for: {identifier} ---")
    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"Status Code: {response.status_code}")
        try:
            print("Response text (bytes):")
            # Print response.text to avoid encoding errors on Windows console
            print(response.text.encode('utf-8'))
        except requests.exceptions.JSONDecodeError:
            print("Response text (bytes, not JSON):")
            print(response.text.encode('utf-8'))
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
    print("-" * (25 + len(identifier)))
    print()

if __name__ == "__main__":
    # Test 1: Correct admin credentials
    test_login("admin", "admin123")
    
    # Test 2: Correct user credentials
    test_login("user", "user123")

    # Test 3: Correct user email
    test_login("user@gispark.com", "user123")
    
    # Test 4: Incorrect password
    test_login("admin", "wrongpassword")

    # Test 5: Incorrect username
    test_login("nonexistentuser", "password")

    # Let's also check the password hashing logic locally
    print("--- Local Password Hash Check ---")
    print(f"Hash for 'admin123': {hash_password('admin123')}")
    print(f"Hash for 'user123':  {hash_password('user123')}")
    print("-" * 31)
