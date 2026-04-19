import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response.data?.message || 'Đã gửi hướng dẫn đặt lại mật khẩu.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể gửi email khôi phục mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-page">
      <div className="auth-card card section-card">
        <div className="hero-banner">
          <h1 style={{ marginTop: 0 }}>Quên mật khẩu</h1>
          <p style={{ marginBottom: 0 }}>Nhập email đã đăng ký. Hệ thống sẽ gửi liên kết đặt lại mật khẩu qua Mailtrap SMTP.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 20 }}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@domain.com" />
          </div>
          {message && <div className="notice">{message}</div>}
          {error && <div className="notice" style={{ borderColor: 'rgba(180, 35, 24, 0.3)', color: 'var(--danger)' }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
          </button>
        </form>

        <p style={{ marginTop: 16, color: 'var(--muted)' }}>
          Nhớ mật khẩu rồi? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
