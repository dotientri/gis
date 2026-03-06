import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <span className="header-logo">🌳</span>
          <h1 className="header-title">Quản Lý Công Viên TP.HCM</h1>
        </div>

        <nav className="header-nav">
          <Link to="/dashboard" className="header-nav-item">Trang Chủ</Link>
          <Link to="/parks" className="header-nav-item">Bản Đồ</Link>
          <Link to="/parks-list" className="header-nav-item">Danh Sách</Link>
          <Link to="/events" className="header-nav-item">Sự Kiện</Link>
        </nav>

        <div className="header-user">
          <div className="user-info">
            <span className="user-name">{user?.ho_ten || user?.ten_dang_nhap}</span>
            <span className="user-role">{user?.ma_nhom_quyen?.ten_nhom || 'User'}</span>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <FiLogOut size={16} />
            Đăng xuất
          </button>
        </div>

        <button
          className="header-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="header-mobile-menu">
          <Link to="/dashboard" className="header-mobile-item">Trang Chủ</Link>
          <Link to="/parks" className="header-mobile-item">Bản Đồ</Link>
          <Link to="/parks-list" className="header-mobile-item">Danh Sách</Link>
          <Link to="/events" className="header-mobile-item">Sự Kiện</Link>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <FiLogOut size={16} />
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}
