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
    fetchStats();
  }, []);

  useEffect(() => {
    if (statsData) {
      setStatistics(statsData);
    }
  }, [statsData]);

  // Xử lý dữ liệu phân trang từ API
  const parkList = parks?.results || [];
  const incidentList = incidents?.results || [];

  const statCards = [
    {
      title: 'Tổng Công Viên',
      value: statistics?.total_parks || parkList.length || 0,
      color: 'bg-blue-500',
    },
    {
      title: 'Lượng Khách Hôm Nay',
      value: statistics?.visitors_today || 0,
      color: 'bg-green-500',
    },
    {
      title: 'Sự Cố Chờ Xử Lý',
      value: statistics?.pending_incidents || incidentList.filter(i => i.trang_thai === 'cho_xu_ly').length || 0,
      color: 'bg-amber-500',
    },
    {
      title: 'Đánh Giá Chờ Duyệt',
      value: statistics?.pending_ratings || 0,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="dashboard-page">
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
          <div className="info-row">
            <span className="info-label">Ngày cập nhật cuối cùng:</span>
            <span className="info-value">
              {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
