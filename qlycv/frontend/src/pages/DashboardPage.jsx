import { useEffect } from 'react';
import { useApi } from '../hooks';
import { dashboardAPI, parksAPI, incidentsAPI } from '../api';
import { useDashboardStore } from '../store';
import '../styles/pages/DashboardPage.css';

export default function DashboardPage() {
  const { statistics, setStatistics, setLoading } = useDashboardStore();
  const { data: statsData, loading: statsLoading, error: statsError, execute: fetchStats } = useApi(dashboardAPI.getStatistics, false);
  const { data: parks, loading: parksLoading } = useApi(parksAPI.getList, false);
  const { data: incidents } = useApi(incidentsAPI.getList, false);

  useEffect(() => {
    console.log('Dashboard: Fetching statistics...');
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (statsData) {
      setStatistics(statsData);
    }
  }, [statsData]);

  // Xử lý dữ liệu phân trang từ API
  const parkList = parks?.results || [];
  const incidentList = incidents?.results || [];

  // Log for debugging
  useEffect(() => {
    console.log('Dashboard statistics:', { statistics, statsData, parkList, incidentList });
  }, [statistics, statsData, parkList, incidentList]);

  const statCards = [
    {
      title: 'Tổng Công Viên',
      value: statistics?.total_parks !== undefined ? statistics.total_parks : (parkList?.length || 0),
      color: 'bg-blue-500',
    },
    {
      title: 'Lượng Khách Hôm Nay',
      value: statistics?.visitors_today !== undefined ? statistics.visitors_today : 0,
      color: 'bg-green-500',
    },
    {
      title: 'Sự Cố Chờ Xử Lý',
      value: statistics?.pending_incidents !== undefined ? statistics.pending_incidents : (incidentList?.filter(i => i.trang_thai === 'cho_xu_ly')?.length || 0),
      color: 'bg-amber-500',
    },
    {
      title: 'Đánh Giá Chờ Duyệt',
      value: statistics?.pending_ratings !== undefined ? statistics.pending_ratings : 0,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="dashboard-page">
      {/* LIGHT THEME STYLES */}
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
             color: #111827 !important; /* Chữ đen */
             text-shadow: none !important;
        }
        
        /* HOVER */
        .sidebar a:hover, aside a:hover, .nav-link:hover, .pro-menu-item:hover { 
             background-color: #eff6ff !important;
             color: #2563eb !important;
        }
        .sidebar a:hover * { color: #2563eb !important; }
        
        /* ACTIVE STATE: XÁM NHẠT + CHỮ ĐEN */
        .sidebar .active, .sidebar .selected, .sidebar .current, .sidebar .is-active, .sidebar .router-link-active,
        aside .active, aside .selected, aside .current, aside .is-active, aside .router-link-active,
        .nav-link.active, li.active > a, a[aria-current="page"], .pro-menu-item.active {
            background-color: #e5e7eb !important;
            color: #000000 !important;
            font-weight: 700 !important;
            box-shadow: inset 4px 0 0 #3b82f6 !important;
        }
        .sidebar .active *, .sidebar .selected *, [aria-current="page"] * { color: #000000 !important; }

        /* Dashboard specific */
        .dashboard-page { background-color: #f3f4f6; padding: 24px; min-height: 100vh; }
        .page-header h1 { color: #111827; font-weight: 800; }
        .page-header p { color: #6b7280; }
        
        .stat-card { background: #ffffff !important; border: 1px solid #e5e7eb !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 12px; }
        .stat-label { color: #4b5563 !important; font-weight: 600; }
        .stat-value { color: #111827 !important; font-weight: 800; }
        
        .dashboard-section { background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; margin-bottom: 24px; }
        .dashboard-section h2 { color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-bottom: 15px; }
        
        .activity-item { border-bottom: 1px solid #f3f4f6; padding: 10px 0; }
        .activity-title { color: #111827; font-weight: 600; }
        .activity-time { color: #6b7280; }
        
        .task-item { background: #f9fafb; border: 1px solid #e5e7eb; margin-bottom: 8px; border-radius: 6px; padding: 10px; color: #374151; }
        .system-info .info-label { color: #4b5563; font-weight: 500; }
        .system-info .info-value { color: #111827; font-weight: 600; }
        
        /* Smooth Hover Effects */
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; }
      `}</style>
      <div className="page-header">
        <h1>Bảng Điều Khiển</h1>
        <p>Tổng quan hệ thống quản lý công viên</p>
      </div>

      {statsError && <div className="alert alert-error">{statsError}</div>}

      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className={`stat-card ${card.color}`}>
            <div className="stat-content">
              <p className="stat-label">{card.title}</p>
              <p className="stat-value">
                {statsLoading ? <span className="spinner-small" /> : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Hoạt động gần đây</h2>
          {parksLoading ? (
            <div className="spinner">Đang tải...</div>
          ) : (
            <div className="activity-list">
              {parkList.slice(0, 5).map((park) => (
                <div key={park.id} className="activity-item">
                  <div className="activity-content">
                    <p className="activity-title">{park.tens}</p>
                    <p className="activity-time">
                      Diện tích: {(park.dien_tich_m2 / 10000).toFixed(2)} hecta
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Các nhiệm vụ cần làm</h2>
          <div className="task-list">
            <div className="task-item pending">
              <input type="checkbox" />
              <span>Duyệt đánh giá từ cộng đồng</span>
            </div>
            <div className="task-item pending">
              <input type="checkbox" />
              <span>Phê duyệt các sự kiện mới</span>
            </div>
            <div className="task-item pending">
              <input type="checkbox" />
              <span>Xử lý báo cáo sự cố</span>
            </div>
            <div className="task-item completed">
              <input type="checkbox" checked disabled />
              <span>Cập nhật thông tin cây xanh</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section full-width">
        <h2>Thông tin hệ thống</h2>
        <div className="system-info">
          <div className="info-row">
            <span className="info-label">Trạng thái kết nối Backend:</span>
            <span className="info-value status-online">● Đang kết nối</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phiên bản hệ thống:</span>
            <span className="info-value">1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
