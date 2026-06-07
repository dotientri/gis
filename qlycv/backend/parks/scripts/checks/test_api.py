import requests

# Test parks API
print("Testing Parks API:")
r = requests.get('http://localhost:8000/api/cong-vien/ban_do/')
data = r.json()
if isinstance(data, list):
    print(f"  Parks returned: {len(data)}")
else:
    print(f"  Parks returned: {len(data.get('results', []))}")
    print(f"  Response keys: {list(data.keys())}")

# Test incident categories API
print("\nTesting Incident Categories API:")
r = requests.get('http://localhost:8000/api/danh-muc-su-co/')
data = r.json()
if isinstance(data, list):
    print(f"  Categories returned: {len(data)}")
else:
    print(f"  Categories returned: {len(data.get('results', []))}")
    if 'results' in data:
        print(f"  First category: {data['results'][0] if data['results'] else 'None'}")
