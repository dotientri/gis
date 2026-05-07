import { NavLink, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiCalendar, FiGrid, FiHome, FiLayers, FiLogIn, FiLogOut, FiMap, FiShield, FiStar, FiTarget, FiUser, FiUsers } from 'react-icons/fi';
import { authAPI } from '../../api';
import { getInitials, PERMISSION_GROUPS } from '../../constants';
import { useAuthStore } from '../../store';
import './Sidebar.css';

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
      <span className="sidebar-link-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.nhom_quyen_code === PERMISSION_GROUPS.ADMIN;
  const isManager = user?.nhom_quyen_code === PERMISSION_GROUPS.MANAGER;

  const mainLinks = [
    ...(user ? [{ to: '/dashboard', label: 'Tong quan', icon: <FiHome /> }] : []),
    { to: '/parks', label: 'Ban do cong vien', icon: <FiMap /> },
    { to: '/parks-list', label: 'Danh muc cong vien', icon: <FiGrid /> },
    ...(user ? [{ to: '/incidents', label: 'Su co', icon: <FiAlertTriangle /> }] : []),
    ...(user ? [{ to: '/events', label: 'Su kien', icon: <FiCalendar /> }] : []),
    ...(user ? [{ to: '/amenities', label: 'Tien ich', icon: <FiLayers /> }] : []),
  ];

  const operationsLinks = user
    ? [
        { to: '/ratings', label: 'Danh gia', icon: <FiStar /> },
        { to: '/trees', label: 'Cay xanh', icon: <FiTarget /> },
        { to: '/inspections', label: 'Kiem tra', icon: <FiShield /> },
      ]
    : [];

  const adminLinks = isAdmin ? [
    { to: '/admin/users', label: 'Nguoi dung', icon: <FiUsers /> },
    { to: '/admin/contact-requests', label: 'Lien he gui den', icon: <FiUser /> },
  ] : [];

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-top">
        <div className="sidebar-brand-mark">CV</div>
        <div>
          <div className="sidebar-eyebrow">Urban park operations</div>
          <div className="sidebar-brand-title">QlyCV</div>
        </div>
      </div>

      <div className="sidebar-hero">
        <h2>{isManager ? 'Van hanh theo tung cong vien' : 'Dieu hanh he thong cong vien'}</h2>
        <p>
          {isManager
            ? user?.ma_cong_vien_ten || 'Theo doi su co, su kien va tien ich cua cong vien duoc giao.'
            : 'Ban do, nghiep vu hien truong va quan tri du lieu tren mot giao dien thong nhat.'}
        </p>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-group">
          <div className="sidebar-group-title">Dieu huong</div>
          {mainLinks.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {operationsLinks.length > 0 && (
          <div className="sidebar-group">
            <div className="sidebar-group-title">Van hanh</div>
            {operationsLinks.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
            {!isAdmin && <NavItem to="/contact" icon={<FiUser />} label="Lien he" />}
          </div>
        )}

        {adminLinks.length > 0 && (
          <div className="sidebar-group">
            <div className="sidebar-group-title">Quan tri</div>
            {adminLinks.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        )}

        {!user && (
          <div className="sidebar-group">
            <div className="sidebar-group-title">Tai khoan</div>
            <NavItem to="/login" icon={<FiLogIn />} label="Dang nhap" />
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="sidebar-user-card">
              <div className="sidebar-avatar">{getInitials(user.ho_ten || user.ten_dang_nhap)}</div>
              <div>
                <div className="sidebar-user-name">{user.ho_ten || user.ten_dang_nhap}</div>
                <div className="sidebar-user-role">{user.nhom_quyen_ten}</div>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-full" onClick={handleLogout}>
              <FiLogOut /> Dang xuat
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-full" onClick={() => navigate('/login')}>
            <FiUser /> Dang nhap de thao tac
          </button>
        )}
      </div>
    </aside>
  );
}

