# GIS Park Management System - Frontend Documentation

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── api.js                 # API client for backend communication
│   ├── store.js               # Zustand stores for state management
│   ├── constants.js           # Constants and helper functions
│   ├── hooks.js               # Custom React hooks
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Main app component with routing
│   ├── App.css                # Global app styles
│   ├── index.css              # Global CSS and utilities
│   ├── components/
│   │   ├── Layout/            # Layout components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── MainLayout.css
│   │   │   ├── AuthLayout.jsx
│   │   │   └── AuthLayout.css
│   │   ├── Header/            # Header component
│   │   │   ├── Header.jsx
│   │   │   └── Header.css
│   │   ├── Sidebar/           # Navigation sidebar
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.css
│   │   ├── Footer/            # Footer component
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.css
│   │   ├── Notification/      # Notification toast
│   │   │   ├── Notification.jsx
│   │   │   └── Notification.css
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   ├── ParksMap/          # Map component
│   │   ├── Forms/             # Reusable forms
│   │   └── Common/            # Reusable UI components
│   └── pages/
│       ├── Auth/              # Authentication pages
│       │   ├── LoginPage.jsx
│       │   └── RegisterPage.jsx
│       ├── Dashboard/         # Dashboard pages
│       │   └── DashboardPage.jsx
│       ├── Parks/             # Park management pages
│       │   ├── ParkMapPage.jsx
│       │   ├── ParkListPage.jsx
│       │   ├── ParkDetailPage.jsx
│       │   ├── CreateParkPage.jsx
│       │   └── EditParkPage.jsx
│       ├── Amenities/
│       ├── Events/
│       ├── Incidents/
│       ├── Ratings/
│       ├── Trees/
│       ├── Inspections/
│       ├── Admin/
│       └── NotFoundPage.jsx
├── index.html                 # HTML template
├── package.json              # Dependencies
├── vite.config.js           # Vite configuration
└── .gitignore
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js 16+ and npm
- Django backend running on http://localhost:8000

### Installation Steps

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:3000`

## 📚 Key Features Implemented

### ✅ Complete Implementation

- **Authentication**: Login/Register with JWT tokens
- **Dashboard**: Statistics and overview of parks
- **Park Management**:
  - Interactive map with Leaflet.js
  - List view with filtering and search
  - Create/Edit forms
  - Detail pages with images and ratings
- **GIS Features**:
  - Location-based queries (find nearest parks)
  - Interactive maps with markers and polygons
  - District and location filtering
- **Amenities**: View, create, update amenities
- **Events**: Event management and calendar view
- **Incidents**: Report and track park incidents
- **Ratings**: View and submit park ratings
- **Trees**: Tree inventory management
- **Inspections**: Schedule and track inspections
- **Admin Panel**:
  - User management
  - Approval workflows
  - Moderation tools
- **Role-Based Access**:
  - QUAN_TRI (Admin)
  - QUAN_LY_CV (Park Manager)
  - KIEM_TRA (Inspector)
  - BIEN_TAP_GIS (GIS Editor)
  - CONG_DONG (Community User)

## 🔧 Configuration

### API Configuration

API base URL can be configured via environment variable:

```bash
# In .env file
REACT_APP_API_URL=http://localhost:8000/api
```

### Map Configuration

Edit `src/constants.js`:

```javascript
export const MAP_CONFIG = {
  DEFAULT_CENTER: [10.8231, 106.6797], // Ho Chi Minh City
  DEFAULT_ZOOM: 10,
  TILE_LAYER: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};
```

## 📦 State Management (Zustand)

All state is managed using Zustand stores in `src/store.js`:

- **useAuthStore**: User authentication state
- **useParksStore**: Parks data and current park
- **useRatingsStore**: Ratings data
- **useIncidentsStore**: Incidents data
- **useEventsStore**: Events data
- **useFilterStore**: Current filters
- **useMapStore**: Map state
- **useDashboardStore**: Dashboard statistics
- **useUIStore**: UI state (notifications, modals)

## 🎣 Custom Hooks

Located in `src/hooks.js`:

- **useApi()**: Execute API calls with error handling
- **usePaginatedApi()**: Fetch paginated data
- **useForm()**: Handle form state and validation
- **useAuth()**: Access authentication state
- **useLocalStorage()**: Persist data to localStorage
- **useGeolocation()**: Get user's location
- **useDebounce()**: Debounce values for search
- **usePrevious()**: Get previous value

## 🗳️ API Endpoints Used

All endpoints mapped in `src/api.js`:

```javascript
// Parks
parksAPI.getList();
parksAPI.getDetail(id);
parksAPI.create(data);
parksAPI.update(id, data);
parksAPI.delete(id);
parksAPI.getNearestParks(lat, lon, radius);
parksAPI.getParksNeedingInspection();

// Amenities
amenitiesAPI.getList();
amenitiesAPI.create(data);
amenitiesAPI.update(id, data);
amenitiesAPI.delete(id);

// Events
eventsAPI.getList();
eventsAPI.create(data);
eventsAPI.getUpcoming();
eventsAPI.approve(id);

// Incidents
incidentsAPI.getList();
incidentsAPI.create(data);
incidentsAPI.updateStatus(id, status);
incidentsAPI.assign(id, managerId);

// Ratings
ratingsAPI.getList();
ratingsAPI.create(data);
ratingsAPI.getUnapproved();
ratingsAPI.approve(id);
ratingsAPI.reject(id);

// Inspections
inspectionsAPI.getList();
inspectionsAPI.create(data);

// Trees
treesAPI.getList();
treesAPI.create(data);
treesAPI.update(id, data);
treesAPI.getStatistics();

// Users
usersAPI.getList();
usersAPI.create(data);
usersAPI.update(id, data);
usersAPI.delete(id);

// Dashboard
dashboardAPI.getStatistics();
```

## 🎨 Styling

- **Global variables** defined in `:root` selector
- **Utility classes** for spacing, alignment, typography
- **BEM methodology** for component naming
- **Responsive design** with mobile-first approach
- **CSS variables** for theme colors

Color Palette:

- Primary: `#22c55e` (Green)
- Secondary: `#3b82f6` (Blue)
- Danger: `#ef4444` (Red)
- Warning: `#f59e0b` (Amber)

## 🗂️ Component Guidelines

### Creating New Components

```javascript
// Example: NewComponent.jsx
import "./NewComponent.css";

export default function NewComponent({ prop1, prop2 }) {
  return <div className="new-component">{/* Component content */}</div>;
}
```

### Using API

```javascript
import { useApi } from "../hooks";
import { parksAPI } from "../api";

const { data: parks, loading, error, execute } = useApi(parksAPI.getList);
```

### Using Forms

```javascript
import { useForm } from "../hooks";

const form = useForm({ name: "", email: "" }, async (values) => {
  await someAPI.create(values);
});

return (
  <form onSubmit={form.handleSubmit}>
    <input
      name="name"
      value={form.values.name}
      onChange={form.handleChange}
      onBlur={form.handleBlur}
    />
    {form.errors.name && <span>{form.errors.name}</span>}
  </form>
);
```

## 🗺️ Map Component Setup

The map component uses React Leaflet with the following features:

- Tile layer from OpenStreetMap
- Markers for parks
- Polygon visualization for park boundaries
- Popup with park information
- Zoom and pan controls
- Layer control

```javascript
<MapContainer center={[10.8231, 106.6797]} zoom={10}>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="&copy; OpenStreetMap contributors"
  />
  {parks.map((park) => (
    <Marker key={park.id} position={[park.lat, park.lon]}>
      <Popup>{park.ten_cong_vien}</Popup>
    </Marker>
  ))}
</MapContainer>
```

## 📱 Responsive Design

Breakpoints:

- Mobile: < 480px
- Tablet: 480px - 768px
- Desktop: > 768px

## 🔐 Authentication Flow

1. User navigates to `/login`
2. Submits credentials (ten_dang_nhap, mat_khau)
3. Backend returns JWT access token
4. Token stored in localStorage
5. Token included in all API requests
6. Protected routes check token existence
7. User can logout which clears token

## 🚨 Error Handling

All API errors are captured and:

1. Logged to console
2. Displayed as toast notification
3. Stored in component error state
4. Form validation errors displayed inline

## 📊 Data Flow

```
User Action
   ↓
Component Event Handler
   ↓
API Call (useApi hook)
   ↓
Backend Response
   ↓
Store Update (Zustand)
   ↓
Component Re-render
   ↓
UI Update
```

## 🧪 Testing

Components can be tested using:

- Jest for unit tests
- React Testing Library for component tests
- Cypress for E2E tests

## 📝 Environment Variables

Create `.env` file in frontend directory:

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_MAP_CENTER_LAT=10.8231
REACT_APP_MAP_CENTER_LNG=106.6797
```

## 🐛 Troubleshooting

### CORS Issues

Ensure backend has CORS enabled for frontend URL in `settings.py`

### API Connection Failed

Check backend is running on `http://localhost:8000`

### Map Not Loading

Ensure Leaflet CSS is loaded in `index.html`

### Token Not Persisting

Check browser localStorage is enabled

## 📞 Support

For issues or questions, refer to:

- API documentation in `backend/IMPLEMENTATION_STATUS.md`
- Component README files in each folder
- Comments in source code

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Navigate to `http://localhost:3000`
4. Login with test credentials
5. Explore the GIS park management system

---

**Version**: 1.0.0  
**Last Updated**: February 27, 2026  
**Frontend Framework**: React 18.3.0  
**State Management**: Zustand 4.4.0  
**Map Library**: React Leaflet 4.2.1
