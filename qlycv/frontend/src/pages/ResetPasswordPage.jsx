import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authAPI.resetPassword({ token, ...form });
      setMessage(response.data?.message || 'Đã đặt lại mật khẩu thành công.');
      setForm({ password: '', confirm_password: '' });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-page">
      <div className="auth-card card section-card">
        <div className="hero-banner">
          <h1 style={{ marginTop: 0 }}>Đặt lại mật khẩu</h1>
          <p style={{ marginBottom: 0 }}>Liên kết reset chỉ hợp lệ khi token trong email Mailtrap còn hạn.</p>
        </div>

        {!token ? (
          <div className="notice" style={{ marginTop: 20, color: 'var(--danger)' }}>
            Thiếu token reset. Hãy mở lại liên kết được gửi qua email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" required value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" required value={form.confirm_password} onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))} />
            </div>
            {message && <div className="notice">{message}</div>}
            {error && <div className="notice" style={{ borderColor: 'rgba(180, 35, 24, 0.3)', color: 'var(--danger)' }}>{error}</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 16, color: 'var(--muted)' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
