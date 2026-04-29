import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import PasswordField from '../components/Form/PasswordField';
import { hasAnyRole, PERMISSION_GROUPS } from '../constants';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login({ email: identifier, password });
      setToken(response.data.token);
      setUser(response.data.user);
      const nextRoute = hasAnyRole(response.data.user, [PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.ADMIN]) ? '/dashboard' : '/profile';
      navigate(nextRoute, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-page">
      <div className="auth-card card section-card">
        <div className="hero-banner" style={{ marginBottom: 20 }}>
          <h1 style={{ marginTop: 0 }}>Đăng nhập hệ thống</h1>
          <p style={{ marginBottom: 0 }}>Khách có thể xem bài viết, công viên và sự kiện. Đăng nhập để báo sự cố, quản lý hồ sơ hoặc vào dashboard theo vai trò.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div className="form-group">
            <label>Tên đăng nhập hoặc email</label>
            <input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="admin hoặc admin@example.com" />
          </div>
          <PasswordField label="Mật khẩu" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          {error && <div className="notice" style={{ color: 'var(--danger)' }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Đăng ký</Link></p>
          <Link to="/forgot-password" style={{ color: 'var(--accent)', fontWeight: 700 }}>Quên mật khẩu?</Link>
        </div>
      </div>
    </div>
  );
}
