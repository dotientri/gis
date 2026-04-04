import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore, useUIStore } from './store';
import { authAPI } from './api';

// Layouts
import AuthLayout from './components/Layout/AuthLayout';
import Sidebar from './components/Sidebar/Sidebar';

// Pages - Auth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Pages - Parks
import ParkMapPage from './pages/ParkMapPage';
import ParkListPage from './pages/ParkListPage';
import ParkDetailPage from './pages/ParkDetailPage';
import CreateParkPage from './pages/CreateParkPage';
import EditParkPage from './pages/EditParkPage';

// Pages - Admin
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserFormPage from './pages/AdminUserFormPage';

// Pages - Other
import ParkArticlesPage from './pages/ParkArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import AmenitiesPage from './pages/AmenitiesPage';
import CreateAmenityPage from './pages/CreateAmenityPage';
import EditAmenityPage from './pages/EditAmenityPage';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IncidentsPage from './pages/IncidentsPage';
import RatingsPage from './pages/RatingsPage';
import TreesPage from './pages/TreesPage';
import InspectionsPage from './pages/InspectionsPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Notification from './components/Notification/Notification';

import './App.css';

function App() {
  const { user, setUser, token } = useAuthStore();

  // Load user data on mount if token exists
  useEffect(() => {
    if (token && !user) {
      const loadUser = async () => {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      };
      loadUser();
    }
  }, [token, user, setUser]);

  const { isSidebarOpen } = useUIStore();

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Root redirect based on auth status */}
        <Route path="/" element={<Navigate to="/articles" replace />} />

        {/* Authentication Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Main Layout Routes (Public & Protected mixed) */}
        <Route element={
          <div className="app-layout" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: '#f3f4f6' }}>
              <Outlet />
            </main>
          </div>
        }>
            {/* --- PUBLIC ROUTES (Ai cũng xem được) --- */}
            <Route path="/articles" element={<ParkArticlesPage />} />
            <Route path="/articles/:id" element={<ArticleDetailPage />} />
            <Route path="/parks" element={<ParkMapPage />} />
            <Route path="/parks-list" element={<ParkListPage />} />
            <Route path="/parks/:id" element={<ParkDetailPage />} />
            
            {/* --- PROTECTED ROUTES (Cần đăng nhập) --- */}
            <Route element={<ProtectedRoute />}>

            {/* Admin Routes */}
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/create" element={<AdminUserFormPage />} />
            <Route path="/admin/users/edit/:id" element={<AdminUserFormPage />} />

            {/* Park Management - Admin Only */}
            <Route element={<ProtectedRoute roles={['QUAN_TRI']} />}>
              <Route path="/parks/create" element={<CreateParkPage />} />
              <Route path="/parks/:id/edit" element={<EditParkPage />} />
            </Route>

            {/* Amenities */}
            <Route path="/amenities" element={<AmenitiesPage />} />
            
            {/* Amenity Management - Admin Only */}
            <Route element={<ProtectedRoute roles={['QUAN_TRI']} />}>
              <Route path="/amenities/create" element={<CreateAmenityPage />} />
              <Route path="/amenities/:id/edit" element={<EditAmenityPage />} />
            </Route>

            {/* Events */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/create" element={<EventFormPage />} />
            <Route path="/events/:id/edit" element={<EventFormPage />} />

            {/* Incidents */}
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/create" element={<CreateIncidentPage />} />

            {/* Ratings */}
            <Route path="/ratings" element={<RatingsPage />} />

            {/* Trees */}
            <Route path="/trees" element={<TreesPage />} />

            {/* Inspections */}
            <Route path="/inspections" element={<InspectionsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Notification */}
      <Notification />
    </Router>
  );
}

export default App;
