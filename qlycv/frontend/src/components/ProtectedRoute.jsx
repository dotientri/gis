import { Navigate, Outlet } from 'react-router-dom';
import { resolveRoleCode } from '../constants';
import { useAuthStore } from '../store';

export default function ProtectedRoute({ roles }) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles?.length) {
    if (!user) {
      return null;
    }

    const userRole = resolveRoleCode(user);
    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
