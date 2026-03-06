import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { authAPI } from '../../api';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Kiểm tra quyền Admin
  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">QUẢN LÝ CÔNG VIÊN</div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className="nav-item">
            <NavLink to="/articles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Bài Viết Công Viên
            </NavLink>
          </li>

          {user && (
            <>
              <li className="nav-item">
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Bảng Điều Khiển
                </NavLink>
              </li>
              
              <li className="nav-item">
                <NavLink to="/parks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Bản Đồ Công Viên
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/parks-list" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Quản Lý Công Viên
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/amenities" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Quản Lý Tiện Ích
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/incidents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Báo Cáo Sự Cố
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/events" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Sự Kiện
                </NavLink>
              </li>
            </>
          )}

          {isAdmin && (
            <li className="nav-item" style={{ marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Quản Trị Người Dùng
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="user-info">
              <strong>{user?.ho_ten || user?.ten_dang_nhap}</strong>
              <small>{user?.nhom_quyen_ten}</small>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Đăng Xuất
            </button>
          </>
        ) : (
          <button onClick={handleLogin} className="btn-logout" style={{backgroundColor: '#3b82f6'}}>
            Đăng Nhập
          </button>
        )}
      </div>
    </aside>
  );
}