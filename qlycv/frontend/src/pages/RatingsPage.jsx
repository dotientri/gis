import { Link } from 'react-router-dom';
import '../styles/pages/PlaceholderPage.css';

export default function RatingsPage() {
  return (
    <div className="placeholder-page">
      {/* LIGHT THEME FORCE STYLE */}
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { background-color: #f3f4f6 !important; color: #111827 !important; height: 100%; }
        
        /* SIDEBAR FIX */
        .sidebar, aside, nav, .left-menu, .nav-menu, .main-sidebar, [class*="sidebar"], [class*="Sidebar"], [class*="Sider"], .pro-sidebar-inner {
            background-color: #ffffff !important;
            background: #ffffff !important;
            border-right: 1px solid #e5e7eb !important;
            box-shadow: 2px 0 10px rgba(0,0,0,0.05) !important;
        }
        .sidebar *, aside *, nav *, [class*="sidebar"] * {
            color: #111827 !important;
            text-shadow: none !important;
        }
        .sidebar a:hover, aside a:hover, .nav-link:hover, .pro-menu-item:hover { 
            background-color: #eff6ff !important;
            color: #2563eb !important;
        }

        /* ACTIVE STATE */
        .sidebar .active, .sidebar .selected, .sidebar .current, .sidebar .is-active, .sidebar .router-link-active,
        aside .active, aside .selected, aside .current, aside .is-active, aside .router-link-active,
        .nav-link.active, li.active > a, a[aria-current="page"], .pro-menu-item.active {
            background-color: #e5e7eb !important;
            color: #000000 !important;
            font-weight: 700 !important;
            box-shadow: inset 4px 0 0 #3b82f6 !important;
        }
        .sidebar .active *, .sidebar .selected *, [aria-current="page"] * { color: #000000 !important; }
      `}</style>
      <div className="placeholder-header">
        <h1>Đánh Giá Công Viên</h1>
        <Link to="/" className="btn btn-primary">+ Thêm Đánh Giá</Link>
      </div>
      <div className="placeholder-content">
        <p>Trang quản lý đánh giá từ cộng đồng</p>
        <p>Xem, duyệt, quản lý các đánh giá và nhận xét.</p>
      </div>
    </div>
  );
}
