import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { authAPI } from '../../api';
import {
  FiHome,
  FiMap,
  FiList,
  FiCalendar,
  FiAlertCircle,
  FiStar,
  FiCheckSquare,
  FiUsers,
  FiCheckCircle,
  FiLogOut,
} from 'react-icons/fi';
import { FaTree } from 'react-icons/fa';
import { PERMISSION_GROUPS } from '../../constants';
import './Sidebar.css';

const MENU_ITEMS = [
  {
    path: '/dashboard',
    label: 'Trang Chủ',
    icon: FiHome,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.INSPECTOR, PERMISSION_GROUPS.EDITOR, PERMISSION_GROUPS.COMMUNITY],
  },
  {
    path: '/parks',
    label: 'Bản Đồ Công Viên',
    icon: FiMap,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.INSPECTOR, PERMISSION_GROUPS.EDITOR, PERMISSION_GROUPS.COMMUNITY],
  },
  {
    path: '/parks-list',
    label: 'Danh Sách Công Viên',
    icon: FiList,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.INSPECTOR, PERMISSION_GROUPS.EDITOR, PERMISSION_GROUPS.COMMUNITY],
  },
  {
    path: '/amenities',
    label: 'Tiện Ích',
    icon: FiCheckSquare,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.EDITOR],
  },
  {
    path: '/events',
    label: 'Sự Kiện',
    icon: FiCalendar,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.EDITOR, PERMISSION_GROUPS.COMMUNITY],
  },
  {
    path: '/incidents',
    label: 'Báo Cáo Sự Cố',
    icon: FiAlertCircle,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.COMMUNITY],
  },
  {
    path: '/ratings',
    label: 'Đánh Giá',
    icon: FiStar,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.COMMUNITY],
  },
  {
    path: '/trees',
    label: 'Cây Xanh',
    icon: FaTree,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.EDITOR],
  },
  {
    path: '/inspections',
    label: 'Kiểm Tra',
    icon: FiCheckCircle,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.INSPECTOR, PERMISSION_GROUPS.MANAGER],
  },
  {
    path: '/admin/users',
    label: 'Quản Lý Người Dùng',
    icon: FiUsers,
    roles: [PERMISSION_GROUPS.ADMIN],
  },
  {
    path: '/admin/approvals',
    label: 'Duyệt Phê Duyệt',
    icon: FiCheckCircle,
    roles: [PERMISSION_GROUPS.ADMIN, PERMISSION_GROUPS.MANAGER],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setToken, setUser } = useAuthStore();
  
  const handleLogout = () => {
    authAPI.logout();
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  // --- LOGIC FIX: Xử lý phân quyền an toàn hơn ---
  let userRole = user?.ma_nhom_quyen?.ten_nhom;

  // Nếu đã đăng nhập nhưng không đọc được role (do lỗi API trả về ID hoặc null)
  if (user && !userRole) {
    // Kiểm tra nhanh nếu là admin (dựa vào username/email đã seed)
    if (user.ten_dang_nhap === 'admin' || user.email?.includes('admin')) {
      userRole = 'QUAN_TRI';
    } else {
      // Mặc định gán quyền CỘNG ĐỒNG để hiện menu cơ bản
      userRole = 'CONG_DONG';
    }
  }
  
  // Fallback chuỗi rỗng để không crash
  userRole = userRole || '';

  const visibleItems = MENU_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="sidebar" style={{ backgroundColor: '#1a1c23', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-header" style={{ padding: '20px', borderBottom: '1px solid #333' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#4ade80', fontSize: '1.2rem' }}>GIS Park</h3>
        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Xin chào, {user?.ho_ten || user?.ten_dang_nhap || 'User'}</div>
      </div>
      <nav className="sidebar-nav" style={{ flex: 1, padding: '10px 0' }}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '10px', borderTop: '1px solid #333' }}>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{ 
            width: '100%', 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer',
            color: '#ef4444',
            justifyContent: 'flex-start'
          }}
        >
          <FiLogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
