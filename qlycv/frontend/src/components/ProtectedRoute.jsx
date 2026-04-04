import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function ProtectedRoute({ roles }) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && user) {
    const userRole = user?.nhom_quyen_code || user?.ma_nhom_quyen?.ten_nhom;
    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
