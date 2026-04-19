import { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiChevronDown, FiGrid, FiLayers, FiLogOut, FiMap, FiMenu, FiShield, FiUser, FiX } from 'react-icons/fi';
import { getRoleLabel, hasAnyRole, PERMISSION_GROUPS, resolveRoleCode } from '../../constants';
import { useAuthStore } from '../../store';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const roleCode = resolveRoleCode(user);

  const links = useMemo(
    () => [
      { to: '/articles', label: 'Bài viết' },
      { to: '/parks', label: 'Bản đồ công viên' },
      { to: '/events', label: 'Sự kiện' },
      { to: '/parks-list', label: 'Danh sách công viên' },
    ],
    []
  );

  const menuItems = useMemo(() => {
    if (!token) return [];

    const items = [{ to: '/profile', label: 'Hồ sơ', icon: <FiUser size={16} /> }];

    if (hasAnyRole(user, [PERMISSION_GROUPS.COMMUNITY, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.ADMIN])) {
      items.push({ to: '/incidents/create', label: 'Báo sự cố', icon: <FiShield size={16} /> });
    }

    if (hasAnyRole(user, [PERMISSION_GROUPS.MANAGER])) {
      items.push({ to: '/dashboard', label: 'Quản lý công viên', icon: <FiMap size={16} /> });
      items.push({ to: '/amenities', label: 'Tiện ích công viên', icon: <FiLayers size={16} /> });
    }

    if (hasAnyRole(user, [PERMISSION_GROUPS.ADMIN])) {
      items.push({ to: '/dashboard', label: 'Dashboard', icon: <FiGrid size={16} /> });
      items.push({ to: '/admin/users', label: 'Quản trị người dùng', icon: <FiShield size={16} /> });
    }

    return items;
  }, [token, user]);

  const handleCloseMenus = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    handleCloseMenus();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link className="header-brand" to="/" onClick={handleCloseMenus}>
          <span className="header-logo">CV</span>
          <div className="header-brand-copy">
            <div className="header-title">Công viên thông minh</div>
            <div className="header-tagline">Thông tin, giám sát và vận hành công viên đô thị</div>
          </div>
        </Link>

        <nav className="header-nav">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `header-nav-item${isActive ? ' active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          {!token ? (
            <>
              <Link className="btn btn-ghost btn-sm" to="/register">Đăng ký</Link>
              <Link className="btn btn-primary btn-sm" to="/login">Đăng nhập</Link>
            </>
          ) : (
            <div className="header-menu">
              <button type="button" className="header-profile-trigger" onClick={() => setMenuOpen((current) => !current)}>
                <span className="header-avatar">{(user?.ho_ten || user?.ten_dang_nhap || 'U').slice(0, 1).toUpperCase()}</span>
                <span className="header-profile-copy">
                  <strong>{user?.ho_ten || user?.ten_dang_nhap}</strong>
                  <small>{getRoleLabel(roleCode)}</small>
                </span>
                <FiChevronDown size={16} />
              </button>

              {menuOpen && (
                <div className="header-dropdown">
                  {menuItems.map((item) => (
                    <Link key={item.to} to={item.to} className="header-dropdown-item" onClick={handleCloseMenus}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <button type="button" className="header-dropdown-item danger" onClick={handleLogout}>
                    <FiLogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button type="button" className="header-mobile-toggle" onClick={() => setMobileMenuOpen((current) => !current)}>
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="header-mobile-menu">
          {links.map((item) => (
            <Link key={item.to} to={item.to} className="header-mobile-item" onClick={handleCloseMenus}>
              {item.label}
            </Link>
          ))}

          {!token ? (
            <div className="header-mobile-auth">
              <Link className="btn btn-ghost btn-sm" to="/register" onClick={handleCloseMenus}>Đăng ký</Link>
              <Link className="btn btn-primary btn-sm" to="/login" onClick={handleCloseMenus}>Đăng nhập</Link>
            </div>
          ) : (
            <>
              {menuItems.map((item) => (
                <Link key={item.to} to={item.to} className="header-mobile-item" onClick={handleCloseMenus}>
                  {item.label}
                </Link>
              ))}
              <button type="button" className="btn btn-danger btn-sm" onClick={handleLogout}>
                <FiLogOut size={16} />
                Đăng xuất
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
