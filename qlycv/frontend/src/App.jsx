import { useEffect } from 'react';
import { BrowserRouter as Router, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { authAPI } from './api';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Notification from './components/Notification/Notification';
import ProtectedRoute from './components/ProtectedRoute';
import { PERMISSION_GROUPS } from './constants';
import { useAuthStore } from './store';
import AdminUserFormPage from './pages/AdminUserFormPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminContactRequestsPage from './pages/AdminContactRequestsPage';
import AmenitiesPage from './pages/AmenitiesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import CreateAmenityPage from './pages/CreateAmenityPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import CreateParkPage from './pages/CreateParkPage';
import ContactPage from './pages/ContactPage';
import DashboardPage from './pages/DashboardPage';
import EditAmenityPage from './pages/EditAmenityPage';
import EditParkPage from './pages/EditParkPage';
import EventFormPage from './pages/EventFormPage';
import EventsPage from './pages/EventsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import IncidentsPage from './pages/IncidentsPage';
import InspectionsPage from './pages/InspectionsPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ParkArticlesPage from './pages/ParkArticlesPage';
import ParkDetailPage from './pages/ParkDetailPage';
import ParkListPage from './pages/ParkListPage';
import ParkMapPage from './pages/ParkMapPage';
import ProfilePage from './pages/ProfilePage';
import RatingsPage from './pages/RatingsPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TreesPage from './pages/TreesPage';
import './App.css';

function AppLayout() {
  const location = useLocation();
  const hideFooter = (
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/admin/') ||
    location.pathname === '/amenities' ||
    location.pathname === '/amenities/create' ||
    location.pathname.startsWith('/amenities/') ||
    location.pathname === '/incidents' ||
    location.pathname === '/ratings' ||
    location.pathname === '/trees' ||
    location.pathname === '/inspections' ||
    location.pathname === '/events/create' ||
    /^\/events\/[^/]+\/edit$/.test(location.pathname) ||
    location.pathname === '/parks/create' ||
    /^\/parks\/[^/]+\/edit$/.test(location.pathname)
  );

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <main className="app-main">
          <Outlet />
        </main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
}

function App() {
  const { user, token, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!token || user) return;

    const loadUser = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } catch (error) {
        console.error('Failed to load current user', error);
        logout();
      }
    };

    loadUser();
  }, [logout, setUser, token, user]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ParkArticlesPage />} />
          <Route path="/articles" element={<ParkArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/parks" element={<ParkMapPage />} />
          <Route path="/parks-list" element={<ParkListPage />} />
          <Route path="/parks/:id" element={<ParkDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={[PERMISSION_GROUPS.COMMUNITY, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.ADMIN]} />}>
            <Route path="/incidents/create" element={<CreateIncidentPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={[PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.ADMIN]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/amenities" element={<AmenitiesPage />} />
            <Route path="/events/create" element={<EventFormPage />} />
            <Route path="/events/:id/edit" element={<EventFormPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
            <Route path="/trees" element={<TreesPage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/parks/:id/edit" element={<EditParkPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={[PERMISSION_GROUPS.ADMIN]} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/contact-requests" element={<AdminContactRequestsPage />} />
            <Route path="/admin/users/create" element={<AdminUserFormPage />} />
            <Route path="/admin/users/edit/:id" element={<AdminUserFormPage />} />
            <Route path="/parks/create" element={<CreateParkPage />} />
            <Route path="/amenities/create" element={<CreateAmenityPage />} />
            <Route path="/amenities/:id/edit" element={<EditAmenityPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Notification />
    </Router>
  );
}

export default App;
