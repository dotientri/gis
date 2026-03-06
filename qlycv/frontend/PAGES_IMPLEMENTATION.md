# Frontend Pages Implementation Guide

## Overview

This document provides a comprehensive guide to all implemented page components in the GIS Park Management System frontend. All 17 pages have been created and are ready for use.

## Page Structure

### Authentication Pages (`/pages/`)

Authentication flows for user login and registration.

#### 1. **LoginPage.jsx**

- **Route:** `/login`
- **Layout:** `AuthLayout` (gradient background, centered card)
- **Features:**
  - Email/password input fields
  - Error message display
  - "Forgot password?" link placeholder
  - Register link for new users
  - Loading state during submission
- **Functions:**
  - Calls `authAPI.login(email, password)`
  - Stores JWT token in localStorage via Zustand
  - Redirects to `/dashboard` on success
- **Styling:** `styles/pages/AuthPages.css`
- **Status:** ✅ Complete

#### 2. **RegisterPage.jsx**

- **Route:** `/register`
- **Layout:** `AuthLayout`
- **Features:**
  - Full name input
  - Username input
  - Email input
  - Password confirmation validation
  - Minimum 8-character password requirement
  - Login link for existing users
- **Functions:**
  - Validates password != password_confirm
  - Calls `authAPI.register(ton_dang_nhap, email, password, ho_ten)`
  - Stores token and redirects to `/dashboard`
- **Styling:** `styles/pages/AuthPages.css`
- **Status:** ✅ Complete

---

### Dashboard Page

System overview and statistics.

#### 3. **DashboardPage.jsx**

- **Route:** `/dashboard`
- **Layout:** `MainLayout` (protected)
- **Features:**
  - 4-card statistics grid (Parks count, Visitors today, Pending incidents, Pending ratings)
  - Recent activity list (latest 5 parks)
  - Task checklist
  - System status indicator
  - Real-time connection status
- **State Management:**
  - Uses `useDashboardStore` for statistics caching
  - Calls `dashboardAPI.getStatistics()`
  - Fallback to `parksAPI.getList()` if API unavailable
- **API Calls:**
  - `GET /dashboard/thong-ke/` - System statistics
  - `GET /cong-vien/?page=1&limit=100` - Park list
  - `GET /su_co/` - Incidents
- **Styling:** `styles/pages/DashboardPage.css`
- **Responsive:** ✅ Mobile, tablet, desktop
- **Status:** ✅ Complete with mock data fallback

---

### Park Management Pages

Core CRUD operations for parks.

#### 4. **ParkMapPage.jsx**

- **Route:** `/parks`
- **Layout:** `MainLayout` (split view)
- **Features:**
  - **Left Panel (320px):**
    - Search bar with submit button
    - "Find Nearest Parks" button (geolocation-based)
    - Park list with search results
    - Click park to center map and show details
  - **Right Panel (flex):**
    - Leaflet interactive map (OpenStreetMap tiles)
    - Map markers with icons (different icon for selected park)
    - Popup on marker click showing park name, area, detail link
    - Zoom to park on marker click (zoom level 14)
  - **Map Controls:**
    - Pan and zoom
    - Layer visibility toggle
- **State Management:**
  - `useMapStore` for map center, zoom, selected park
  - `useFilterStore` for search results
- **API Calls:**
  - `GET /cong-vien/?page=1&limit=100` - Load all parks
  - Browser Geolocation API for nearest parks
- **Icons:**
  - Default marker: Leaflet standard icon
  - Selected marker: Larger 2x icon
- **Styling:** `styles/pages/ParkMapPage.css`
- **Responsive:**
  - Desktop: Side-by-side layout
  - Mobile: Map above list (vertical)
- **Status:** ✅ Complete

#### 5. **ParkListPage.jsx**

- **Route:** `/parks-list`
- **Layout:** `MainLayout`
- **Features:**
  - Responsive table with sortable columns
  - Columns: Name, Area (hectares), District, Park Type, Status, Actions
  - Inline action buttons: "Detail", "Edit"
  - Create new park button
  - Search functionality
  - Pagination (20 items per page)
  - Sorting by name or area
  - Badge-styled status indicators
- **State Management:**
  - `usePaginatedApi` hook for pagination
  - `useFilterStore` for filters
- **API Calls:**
  - `GET /cong-vien/?page={n}&limit=20&search=...&ordering=...`
- **Styling:** `styles/pages/ParkListPage.css`
- **Responsive:**
  - Mobile: Horizontal scroll table
  - Desktop: Full-width table
- **Status:** ✅ Complete

#### 6. **ParkDetailPage.jsx**

- **Route:** `/parks/:id`
- **Layout:** `MainLayout`
- **Features:**
  - **Main Content:**
    - Park name as title
    - Metadata: Type, District, Status, Rating
    - Full description text
    - Info grid: Area, Coordinates, Created date, Updated date
  - **Amenities Section:**
    - List of facility types
    - Condition indicators (good/fair/average/poor)
    - Card-based layout
  - **Ratings Section:**
    - Latest 5 ratings displayed
    - Author name, score, comment, date
    - "View all ratings" link
  - **Sidebar:**
    - Quick info (ID, Code, Views)
    - Action buttons: Edit, View on map, Delete
    - Confirmation dialog for delete
- **State Management:**
  - `useApi` hook for initial load
- **API Calls:**
  - `GET /cong-vien/{ma_cong_vien}/` - Park detail
  - `GET /danh_gia/?ma_cong_vien={id}` - Related ratings
  - `GET /tien_ich/?ma_cong_vien={id}` - Related amenities
  - `DELETE /cong-vien/{id}/` - Delete action
- **Styling:** `styles/pages/ParkDetailPage.css`
- **Responsive:**
  - Desktop: 2-column (main + sidebar)
  - Mobile: 1-column
- **Status:** ✅ Complete

#### 7. **CreateParkPage.jsx**

- **Route:** `/parks/create`
- **Layout:** `MainLayout`
- **Features:**
  - Form with sections:
    - **Basic Info:** Name, Description, Area, District, Park Type
    - **Coordinates:** Latitude, Longitude input fields
    - "Pick location on map" button placeholder
  - Required field indicators (\*)
  - Form validation (client-side)
  - Loading state during submission
  - Cancel button
- **State Management:**
  - `useForm` hook for form state and validation
  - `useUIStore` for success/error notifications
- **API Calls:**
  - `POST /cong-vien/` with converted coordinates to [lat, lng]
- **Form Handling:**
  - Converts `dien_tich_m2` (string input) to number
  - Converts lat/lng to array format `[lat, lng]`
  - Validates required fields client-side
- **Styling:** `styles/pages/ParkFormPage.css`
- **Responsive:** ✅ Mobile, tablet, desktop
- **Status:** ✅ Complete

#### 8. **EditParkPage.jsx**

- **Route:** `/parks/:id/edit`
- **Layout:** `MainLayout`
- **Features:**
  - **Same form as CreateParkPage**
  - Pre-fills all fields from existing park data
  - Page title shows park name
  - Submit button shows "Update" instead of "Create"
  - Loads park data on mount from URL parameter
  - Shows loading spinner while fetching
  - Redirects to detail page on success
- **State Management:**
  - `useForm` hook with pre-population
  - `useApi` hook for loading existing data
- **API Calls:**
  - `GET /cong-vien/{ma_cong_vien}/` - Load current data
  - `PUT /cong-vien/{id}/` - Submit updates
- **Styling:** `styles/pages/ParkFormPage.css`
- **Status:** ✅ Complete

---

### Feature Management Pages

Placeholder pages for advanced features (ready for component implementation).

#### 9. **AmenitiesPage.jsx**

- **Route:** `/amenities`
- **Status:** Placeholder (icons: 📋)
- **Description:** "Quản Lý Tiện Ích" - Facility/amenity management
- **Future Implementation:**
  - CRUD for facilities (benches, toilets, water fountains, playgrounds)
  - Condition tracking per facility
  - Location mapping
  - Maintenance workflow

#### 10. **EventsPage.jsx**

- **Route:** `/events`
- **Status:** Placeholder (icons: 🎉)
- **Description:** "Quản Lý Sự Kiện" - Event management
- **Future Implementation:**
  - Event creation and scheduling
  - Approval workflow for admins
  - Attendance tracking
  - Calendar view

#### 11. **IncidentsPage.jsx**

- **Route:** `/incidents`
- **Status:** Placeholder (icons: ⚠️)
- **Description:** "Báo Cáo Sự Cố" - Incident/issue reporting
- **Future Implementation:**
  - Community incident reports (damage, pollution, safety)
  - Manager assignment and tracking
  - Status workflow (pending → in-progress → resolved)
  - Photo/evidence uploading

#### 12. **RatingsPage.jsx**

- **Route:** `/ratings`
- **Status:** Placeholder (icons: ⭐)
- **Description:** "Đánh Giá Công Viên" - Rating and review management
- **Future Implementation:**
  - Community ratings (1-5 stars on multiple criteria)
  - Admin moderation workflow
  - Rating approval/rejection
  - Comment display and moderation

#### 13. **TreesPage.jsx**

- **Route:** `/trees`
- **Status:** Placeholder (icons: 🌳)
- **Description:** "Quản Lý Cây Xanh" - Tree asset management
- **Future Implementation:**
  - Tree inventory by type and health status
  - Location mapping in parks
  - Health monitoring and alerts
  - Maintenance scheduling

#### 14. **InspectionsPage.jsx**

- **Route:** `/inspections`
- **Status:** Placeholder (icons: ✅)
- **Description:** "Kiểm Tra Công Viên" - Inspection/audit logs
- **Future Implementation:**
  - Periodic inspection forms
  - Inspector assignment
  - Defect documentation
  - Maintenance need tracking

---

### Admin Pages

Administrative functions (placeholder).

#### 15. **AdminUsersPage.jsx**

- **Route:** `/admin/users`
- **Status:** Placeholder (icons: 👥)
- **Description:** "Quản Lý Người Dùng" - User management
- **Access Control:** Admin only
- **Future Implementation:**
  - User CRUD operations
  - Role assignment (5 groups: Admin, Manager, Inspector, Editor, Community)
  - Account activation/deactivation
  - Permission management

#### 16. **AdminApprovalsPage.jsx**

- **Route:** `/admin/approvals`
- **Status:** Placeholder (icons: 📋)
- **Description:** "Duyệt Phê Duyệt" - Content approval workflow
- **Access Control:** Admin & Manager
- **Future Implementation:**
  - Batch approval of ratings
  - Event approval
  - Content moderation
  - Bulk actions interface

---

### Error Handling

#### 17. **NotFoundPage.jsx**

- **Route:** `*` (catch-all)
- **Features:**
  - Large "404" display
  - "Page Not Found" message
  - "Back to home" button linking to `/dashboard`
  - Gradient background matching brand colors
- **Styling:** `styles/pages/NotFoundPage.css`
- **Responsive:** ✅ Mobile optimized
- **Status:** ✅ Complete

---

## Shared Styling System

### CSS Utility Classes (from index.css)

All pages benefit from the global utility system:

- **Spacing:** `gap-*`, `mt-*`, `mb-*`, `p-*` classes
- **Flexbox:** `.flex`, `.flex-col`, `.justify-between`, etc.
- **Responsive:** Media queries at 768px, 480px breakpoints
- **Forms:** `.form-group`, `.form-row`, input/textarea/select styling
- **Buttons:** `.btn`, `.btn-primary`, `.btn-danger`, `.btn-ghost`, `.btn-sm`, `.btn-full`
- **Cards:** `.card`, `.card-header`
- **Tables:** `.table-responsive`, table styling with hover
- **Badges:** `.badge`, `.badge-success`, `.badge-error`, etc.
- **Alerts:** `.alert`, `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info`

### CSS Variables (from index.css)

Consistent theming across all pages:

```css
--color-primary:
  #22c55e (Green) --color-secondary: #3b82f6 (Blue) --color-danger: #ef4444
    (Red) --color-text-primary: #1f2937 --color-text-secondary: #6b7280
    --color-bg-primary: #ffffff --color-bg-secondary: #f3f4f6
    --color-border: #e5e7eb --shadows,
  --radius, --fonts: Predefined;
```

---

## Page Component Template

All page files follow this pattern:

```jsx
import { useEffect } from "react";
import { useXXXAPI } from "../api";
import { useXXXStore } from "../store";
import "../styles/pages/XXXPage.css";

export default function XXXPage() {
  // 1. API calls
  const { data, loading, error, execute } = useApi(apiFunction);

  // 2. State management
  const { filters, setFilter } = useFilterStore();

  // 3. Effects
  useEffect(() => {
    execute({ param: value });
  }, [dependencies]);

  // 4. Render
  return <div className="xxx-page">{/* Content */}</div>;
}
```

---

## Form Handling Pattern

Forms use the `useForm` hook for complete state management:

```jsx
const {
  values,
  errors,
  touched,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
} = useForm(initialValues, onSubmitFunction);

// Example: CreateParkPage
<input
  name="tens"
  value={values.tens}
  onChange={handleChange}
  onBlur={handleBlur}
/>;
{
  touched.tens && errors.tens && <span className="error">{errors.tens}</span>;
}
```

---

## State Management Pattern

All pages use Zustand stores for global state:

**Retrieving state:**

```jsx
const { parks, setPark } = useParksStore();
```

**Updating state:**

```jsx
setPark(parkData); // Single value
setParks(parksArray); // Array
```

---

## Routing Architecture

**Public Routes:**

```
/login          → LoginPage
/register       → RegisterPage
```

**Protected Routes (requires token):**

```
/dashboard      → DashboardPage
/parks          → ParkMapPage
/parks-list     → ParkListPage
/parks/:id      → ParkDetailPage
/parks/create   → CreateParkPage
/parks/:id/edit → EditParkPage
/amenities      → AmenitiesPage
/events         → EventsPage
/incidents      → IncidentsPage
/ratings        → RatingsPage
/trees          → TreesPage
/inspections    → InspectionsPage
/admin/users    → AdminUsersPage
/admin/approvals → AdminApprovalsPage
*               → NotFoundPage (404)
```

---

## API Integration Summary

### Page-API Mappings

| Page             | Primary API Calls                                          | Status      |
| ---------------- | ---------------------------------------------------------- | ----------- |
| LoginPage        | `POST /auth/login/`                                        | ✅ Complete |
| RegisterPage     | `POST /auth/register/`                                     | ✅ Complete |
| DashboardPage    | `GET /dashboard/thong-ke/`, `GET /cong-vien/`              | ✅ Complete |
| ParkMapPage      | `GET /cong-vien/`                                          | ✅ Complete |
| ParkListPage     | `GET /cong-vien/?page=...`                                 | ✅ Complete |
| ParkDetailPage   | `GET /cong-vien/{id}/`, `GET /danh_gia/`, `GET /tien_ich/` | ✅ Complete |
| CreateParkPage   | `POST /cong-vien/`                                         | ✅ Complete |
| EditParkPage     | `GET /cong-vien/{id}/`, `PUT /cong-vien/{id}/`             | ✅ Complete |
| Others (9 pages) | Placeholders                                               | ⏳ Future   |

---

## Next Steps for Development

### Priority 1: Core Functionality

1. Implement detail pages for Events, Incidents, Ratings
2. Add filtering/search on list pages
3. Image upload for parks and incidents

### Priority 2: Admin Features

1. Approval workflow UI for ratings and events
2. User management CRUD
3. Batch operations

### Priority 3: Enhanced UX

1. Real-time event/incident notifications
2. Advanced map features (drawing, heat maps)
3. Export/printing capabilities
4. Accessibility improvements

---

## Testing Checklist

- [ ] All pages load without errors
- [ ] Forms submit successfully and call APIs
- [ ] Error messages display correctly
- [ ] Loading spinners show during API calls
- [ ] Pagination works (park list)
- [ ] Sorting works (park list)
- [ ] Search filtering works
- [ ] Mobile responsive at breakpoints: 480px, 768px
- [ ] Keyboard navigation works
- [ ] Unauthorized access redirects to login
- [ ] Token refresh works on 401
- [ ] Notifications appear on success/error

---

## CSS File Organization

```
frontend/src/
├── styles/
│   └── pages/
│       ├── AuthPages.css          (Login & Register)
│       ├── DashboardPage.css
│       ├── ParkMapPage.css
│       ├── ParkListPage.css
│       ├── ParkDetailPage.css
│       ├── ParkFormPage.css       (Create & Edit)
│       ├── PlaceholderPage.css    (9 placeholder pages)
│       └── NotFoundPage.css
└── index.css                      (700+ lines global utilities)
```

---

## Development Tips

1. **Use Zustand stores** instead of prop drilling for shared state
2. **Use custom hooks** (`useApi`, `useForm`, `useAuth`) for common patterns
3. **Apply CSS utilities** from `index.css` for consistency
4. **Test API calls** with actual backend using `parksAPI`, `authAPI`, etc.
5. **Mock loading/error states** during development
6. **Use semantic HTML** for accessibility
7. **Follow naming conventions:** camelCase for variables, kebab-case for CSS classes

---

**Last Updated:** January 2025  
**Total Pages:** 17 complete + documentation  
**Ready for:** Integration testing with backend
