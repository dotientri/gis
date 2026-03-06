# 📋 ISSUES & FEATURES TO IMPLEMENT

## ✅ COMPLETED (Fixed/Working)

- [x] Console error: `getTrangThaiCode is not a function` → **FIXED**
- [x] Database initialization with 6 parks + 16 amenities
- [x] ParkListPage styling with gradients and responsive design
- [x] Map integration in CreateParkPage
- [x] Safe null-checking for all park relations
- [x] Build passes with 0 errors

---

## ⚠️ PENDING FEATURES (Need to implement)

### Issue 1: Drag Location then "Find Nearby" Goes Back to Old Position

**Status**: ❌ NOT FIXED
**File**: `frontend/src/pages/CreateParkPage.jsx`
**Problem**:

- User drags map marker to new location
- Presses "Find nearby parks" button
- Map resets to original position instead of staying on marked location

**Solution Needed**:

```javascript
// In LocationMarker component, need to:
// 1. Save dragged position to state
// 2. When searching nearby, update map bounds to center on marked location
// 3. Preserve marker position after search completes
```

**Estimated Time**: 30-45 minutes

---

### Issue 2: No Navigation/Direction Guidance from Location to Park

**Status**: ❌ NOT IMPLEMENTED
**File**: `frontend/src/pages/ParkDetailPage.jsx`
**Problem**:

- User can see park location on map
- But cannot get directions from current location to park
- No integration with routing services (Google Maps, OpenStreetMap, etc.)

**Solution Needed**:

1. Add directions button in ParkDetailPage
2. Integrate with routing provider (e.g., `@mapbox/mapbox-gl-directions` or `leaflet-routing-machine`)
3. Show turn-by-turn directions
4. Example:

```javascript
// Install: npm install leaflet-routing-machine
// Add route from current location to park
L.Routing.control({
  waypoints: [current_location, park_location],
  routeWhileDragging: true,
}).addTo(map);
```

**Estimated Time**: 1-2 hours

---

### Issue 3: Desktop App Doesn't Show Map for Marking Latitude/Longitude

**Status**: ❌ NOT IMPLEMENTED
**File**: `gis_desktop_app.py` or `gis_desktop_app_lite.py`
**Problem**:

- Desktop application missing interactive map
- Users cannot drag-and-drop to mark coordinates
- Map latitude/longitude input is manual/text-only

**Solution Needed**:

1. Add map widget to desktop app (e.g., using `folium` + `tkinterweb` or `PyQtWebKit`)
2. Display interactive map in a canvas/frame
3. Allow click-to-mark functionality like web version
4. Example:

```python
# Install: pip install folium
# In desktop app:
import folium
from tkinterweb import TkinterWeb

# Create map
map_obj = folium.Map(location=[21.0285, 105.8542], zoom_start=12)
map_obj.save('temp_map.html')

# Display in Tkinter
web_frame = TkinterWeb.DOMNode(root)
web_frame.load('file://temp_map.html')
```

**Estimated Time**: 2-3 hours

---

### Issue 4: Web Form Not Synced with Desktop Tool

**Status**: ❌ NOT SYNCED
**Files**:

- `frontend/src/pages/CreateParkPage.jsx` (web form)
- `gis_desktop_app.py` (desktop form)

**Problem**:

- Data created in web doesn't appear in desktop app
- Data created in desktop doesn't appear in web
- Forms have different fields and validation rules
- No real-time sync mechanism

**Solution Needed**:

1. **Unify data structure** - Both should use same API endpoints
2. **Add auto-sync** - Desktop should fetch updates from backend periodically
3. **Use same React components** - Or replicate identical form validation
4. Example sync mechanism:

```python
# Desktop app periodically fetch latest data
import requests
import threading
import time

def sync_data():
    while True:
        try:
            response = requests.get('http://localhost:8000/api/cong-vien/')
            parks = response.json()['results']
            # Update desktop UI with parks data
            update_parks_list(parks)
        except Exception as e:
            print(f"Sync error: {e}")
        time.sleep(5)  # Sync every 5 seconds

# Start sync in background
threading.Thread(target=sync_data, daemon=True).start()
```

**Estimated Time**: 3-4 hours

---

### Issue 5: User Dashboard Same as Admin Dashboard

**Status**: ❌ DIFFERENT ROLES NEED DIFFERENT UI
**Files**:

- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/components/Sidebar/Sidebar.jsx`
- `parks/serializers.py` (need to check user permissions)

**Problem**:

- Admin user sees all features and data
- Regular user should see limited features:
  - ✅ Can view parks list
  - ✅ Can view park details
  - ❌ Should NOT see admin functions
  - ❌ Should NOT see user management
  - ❌ Should NOT see advanced analytics
- Current implementation treats all users the same

**Solution Needed**:

1. **Check user permissions on frontend**:

```javascript
// In Sidebar.jsx
const isAdmin =
  localStorage.getItem("user_role") === "admin" ||
  user?.groups?.includes("NhomQuyen_Admin");

// Conditionally show menu items
{
  isAdmin && (
    <>
      <Link to="/admin">Admin Panel</Link>
      <Link to="/users">Manage Users</Link>
      <Link to="/reports">Reports</Link>
    </>
  );
}
```

2. **Add role field to user model** (if not present)
3. **Hide restricted operations** based on user role
4. **Show "You are logged in as USER"** instead of ADMIN

**Estimated Time**: 1-2 hours

---

### Issue 6: Desktop App Navigation

**Status**: ⚠️ PARTIALLY IMPLEMENTED
**File**: `gis_desktop_app.py`
**Problem**:

- Desktop app may have outdated menu structure
- Navigation between screens might be broken
- Missing some features from web version

**Solution Needed**:

- Sync desktop app menus with web app
- Update desktop app to match web app flow
- Test all navigation paths

**Estimated Time**: 1-2 hours

---

## 🎯 Implementation Priority

### Priority 1 (Critical)

1. ✅ Fix `getTrangThaiCode` error → **DONE**
2. ⚠️ Issue 5: User vs Admin Dashboard → **2 hours**
3. ⚠️ Issue 1: Drag Location Fix → **1 hour**

### Priority 2 (Important)

4. Issue 4: Form Sync (Web ↔ Desktop) → **3-4 hours**
5. Issue 3: Desktop App Map → **2-3 hours**

### Priority 3 (Nice to Have)

6. Issue 2: Navigation/Directions → **1-2 hours**
7. Issue 6: Desktop App Navigation → **1-2 hours**

---

## 📊 Effort Estimate

| Issue                      | Effort          | Complexity    |
| -------------------------- | --------------- | ------------- |
| #1 - Drag location fix     | 1 hour          | ⭐⭐ Medium   |
| #2 - Navigation directions | 1-2 hours       | ⭐⭐⭐ Medium |
| #3 - Desktop app map       | 2-3 hours       | ⭐⭐⭐⭐ High |
| #4 - Form sync             | 3-4 hours       | ⭐⭐⭐⭐ High |
| #5 - User dashboard        | 1-2 hours       | ⭐⭐ Medium   |
| #6 - Desktop navigation    | 1-2 hours       | ⭐⭐ Medium   |
| **Total Estimated**        | **10-16 hours** | -             |

---

## 🔧 Next Steps (cách thực hiện)

### Chọn 1 trong 6 vấn đề trên để tôi fix:

```bash
# Option 1: Issue #5 (User vs Admin Dashboard)
# Quickest to implement, improves user experience immediately
# User sẽ thấy interface khác admin ngay

# Option 2: Issue #1 (Drag location fix)
# Simple fix, improves map UX
# Drag & drop map location sẽ hoạt động đúng

# Option 3: Issue #4 (Form Sync)
# More complex, but very impactful
# Web & Desktop sẽ đồng bộ dữ liệu realtime

# Option 4: Issue #3 (Desktop App Map)
# Essential for desktop users
# Desktop app sẽ có map để đánh dấu coordinates
```

---

## 📝 How to Request a Fix

Tell me which issue number(s) you want fixed:

- "Fix issue #5" - User vs Admin dashboard
- "Fix issue #1 and #5" - Multiple issues
- "Fix all Priority 1 issues" - Issues #5 and #1

Then I will implement it immediately!

---

**Current Status**: ✅ Core functionality working, need specific features implemented

**Console Error Fixed**: ✅ YES - getTrangThaiCode error resolved
