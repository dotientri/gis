import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import PasswordField from '../components/Form/PasswordField';
import { useAuthStore } from '../store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [form, setForm] = useState({ ho_ten: '', ten_dang_nhap: '', email: '', password: '', password_confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.password_confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register({
        ho_ten: form.ho_ten,
        ten_dang_nhap: form.ten_dang_nhap,
        email: form.email,
        password: form.password,
      });
      setToken(response.data.token);
      setUser(response.data.user);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-page">
      <div className="auth-card card section-card" style={{ maxWidth: 620 }}>
        <div className="hero-banner" style={{ marginBottom: 20 }}>
          <h1 style={{ marginTop: 0 }}>Tạo tài khoản mới</h1>
          <p style={{ marginBottom: 0 }}>Tài khoản đăng ký mới mặc định là người dùng cộng đồng để xem thông tin và gửi báo sự cố.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Họ tên</label>
              <input required value={form.ho_ten} onChange={(event) => setForm((current) => ({ ...current, ho_ten: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input required value={form.ten_dang_nhap} onChange={(event) => setForm((current) => ({ ...current, ten_dang_nhap: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <PasswordField label="Mật khẩu" required value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" />
            <PasswordField label="Xác nhận mật khẩu" required value={form.password_confirm} onChange={(event) => setForm((current) => ({ ...current, password_confirm: event.target.value }))} autoComplete="new-password" />
          </div>
          {error && <div className="notice" style={{ color: 'var(--danger)' }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</button>
        </form>
        <p style={{ color: 'var(--muted)', marginTop: 16 }}>Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Đăng nhập</Link></p>
      </div>
    </div>
  );
}
