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

  // Kiểm tra quyền Admin & Manager
  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';
  const isManager = user?.nhom_quyen_code === 'QUAN_LY';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {isManager ? `📍 ${user?.ma_cong_vien_ten || 'CÔNG VIÊN'}` : 'QUẢN LÝ CÔNG VIÊN'}
        </div>
        {isManager && <div className="sidebar-subtitle">Quản Lý Công Viên</div>}
      </div>

      <nav className="sidebar-nav">
        <ul>
          {!isManager && (
            <li className="nav-item">
              <NavLink to="/articles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Bài Viết Công Viên
              </NavLink>
            </li>
          )}

          {user && (
            <>
              {!isManager && (
                <li className="nav-item">
                  <NavLink to="/parks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    Bản Đồ Công Viên
                  </NavLink>
                </li>
              )}

              <li className="nav-item">
                <NavLink to="/parks-list" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  {isAdmin ? 'Quản Lý Công Viên' : isManager ? '🏞️ Công Viên Của Tôi' : 'Danh Sách Công Viên'}
                </NavLink>
              </li>

              {isManager && user?.ma_cong_vien && (
                <li className="nav-item">
                  <NavLink 
                    to={`/parks/${user.ma_cong_vien}`} 
                    className={({ isActive }) => isActive ? 'nav-link active manager-link' : 'nav-link manager-link'}
                  >
                    📋 Chi Tiết Công Viên
                  </NavLink>
                </li>
              )}

              {isManager && (
                <li className="nav-divider">
                  <div style={{fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', padding: '8px 12px'}}>
                    Quản Lý
                  </div>
                </li>
              )}

              {isManager && (
                <>
                  <li className="nav-item">
                    <NavLink to="/incidents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                      🚨 Sự Cố
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink to="/amenities" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                      🛠️ Tiện Ích
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink to="/events" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                      📅 Sự Kiện
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink to="/ratings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                      ⭐ Đánh Giá
                    </NavLink>
                  </li>
                </>
              )}

              {!isManager && (
                <>
                  {isAdmin && (
                    <li className="nav-item">
                      <NavLink
                        to="/admin/users"
                        className={({ isActive }) => isActive ? 'nav-link active admin-link' : 'nav-link admin-link'}
                      >
                        Quản Lý Người Dùng
                      </NavLink>
                    </li>
                  )}

                  <li className="nav-item">
                    <NavLink to="/amenities" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                      {isAdmin ? 'Quản Lý Tiện Ích' : 'Tiện Ích'}
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink to="/incidents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                      Báo Cáo Sự Cố
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink to="/events" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                      {isAdmin ? 'Quản Lý Sự Kiện' : 'Sự Kiện'}
                    </NavLink>
                  </li>
                </>
              )}
            </>
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