import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import '../styles/pages/AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    ten_dang_nhap: '',
    email: '',
    password: '',
    password_confirm: '',
    ho_ten: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (formData.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        ten_dang_nhap: formData.ten_dang_nhap,
        email: formData.email,
        password: formData.password,
        ho_ten: formData.ho_ten,
      });

      if (response.data.token) {
        setToken(response.data.token);
        if (response.data.user) {
          setUser(response.data.user);
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Đăng ký thất bại. Vui lòng kiểm tra thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      {/* LIGHT THEME FORCE STYLE */}
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { background-color: #f3f4f6 !important; color: #111827 !important; min-height: 100vh; }
      `}</style>
      <h1>Đăng Ký</h1>
      <p className="auth-subtitle">Tạo tài khoản mới</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="ho_ten">Họ và tên</label>
          <input
            id="ho_ten"
            name="ho_ten"
            type="text"
            value={formData.ho_ten}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ten_dang_nhap">Tên đăng nhập</label>
          <input
            id="ten_dang_nhap"
            name="ten_dang_nhap"
            type="text"
            value={formData.ten_dang_nhap}
            onChange={handleChange}
            placeholder="username"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password_confirm">Xác nhận mật khẩu</label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            value={formData.password_confirm}
            onChange={handleChange}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
        </button>
      </form>

      <p className="auth-link">
        Đã có tài khoản?{' '}
        <a href="/login">Đăng nhập tại đây</a>
      </p>
    </div>
  );
}
