import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { parksAPI, incidentsAPI } from '../api';
import { useAuthStore } from '../store';
import '../styles/pages/DashboardPage.css';

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const { data: park, loading: parkLoading, execute: fetchPark } = useApi(parksAPI.getDetail, false);
  const { data: incidentsData, loading: incidentsLoading, execute: fetchIncidents } = useApi(incidentsAPI.getList, false);

  useEffect(() => {
    if (user?.ma_cong_vien) {
      fetchPark(user.ma_cong_vien);
      fetchIncidents({ ma_cong_vien: user.ma_cong_vien, limit: 10 });
    }
  }, [user?.ma_cong_vien]);

  const recentIncidents = incidentsData?.results || [];

  const parkNameDisplay = park?.ten_cong_vien || 'Chưa phân công';

  return (
    <div className="dashboard-page">
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { 
          background-color: #f3f4f6 !important; 
          color: #111827 !important; 
          height: 100%; 
        }
        
        .dashboard-page { 
          background-color: #f3f4f6 !important;
          padding: 24px;
          min-height: 100vh;
        }
        
        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          color: #111827;
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .dashboard-header p {
          color: #6b7280;
          font-size: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-left: 4px solid #3b82f6;
        }

        .stat-card.warning {
          border-left-color: #f59e0b;
        }

        .stat-card.success {
          border-left-color: #10b981;
        }

        .stat-card h3 {
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .stat-card .value {
          color: #111827;
          font-size: 2rem;
          font-weight: 700;
        }

        .stat-card .subtitle {
          color: #9ca3af;
          font-size: 0.85rem;
          margin-top: 4px;
        }

        .section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .section h2 {
          color: #111827;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 12px;
        }

        .park-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-label {
          color: #6b7280;
          font-weight: 500;
        }

        .info-value {
          color: #111827;
          font-weight: 600;
        }

        .incidents-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .incident-item {
          padding: 12px;
          background: #f9fafb;
          border-left: 4px solid #ef4444;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .incident-item.resolved {
          border-left-color: #10b981;
          background: #f0fdf4;
        }

        .incident-title {
          color: #111827;
          font-weight: 600;
        }

        .incident-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .incident-status.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .incident-status.resolved {
          background: #d1fae5;
          color: #065f46;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #111827;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .loading {
          color: #6b7280;
          font-size: 0.95rem;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: #9ca3af;
        }

        .empty-state h3 {
          color: #6b7280;
          margin-bottom: 8px;
        }
      `}</style>

      <div className="dashboard-header">
        <h1>📊 Bảng Điều Khiển Quản Lý</h1>
        <p>Theo dõi thông tin công viên {parkNameDisplay}</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>📍 Công Viên</h3>
          <div className="value">{parkNameDisplay.split(' ')[0]}</div>
          <div className="subtitle">{parkNameDisplay}</div>
        </div>

        <div className="stat-card success">
          <h3>📏 Diện Tích</h3>
          <div className="value">{park?.dien_tich_m2 ? `${(park.dien_tich_m2 / 1000).toFixed(2)} m²` : 'N/A'}</div>
          <div className="subtitle">Tổng diện tích công viên</div>
        </div>

        <div className="stat-card">
          <h3>⭐ Đánh Giá</h3>
          <div className="value">{park?.diem_trung_binh || 0}</div>
          <div className="subtitle">Điểm trung bình</div>
        </div>

        <div className="stat-card warning">
          <h3>🚨 Sự Cố Chờ Xử Lý</h3>
          <div className="value">{recentIncidents.filter(i => i.trang_thai === 'cho_xu_ly').length}</div>
          <div className="subtitle">Trong {recentIncidents.length} sự cố</div>
        </div>
      </div>

      {/* Park Details */}
      {!parkLoading && park && (
        <div className="section">
          <h2>📋 Thông Tin Công Viên</h2>
          <div className="park-info">
            <div className="info-item">
              <span className="info-label">Tên công viên</span>
              <span className="info-value">{park.ten_cong_vien}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Trạng thái</span>
              <span className="info-value">{park.trang_thai_ten || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Quận/Huyện</span>
              <span className="info-value">{park.quan_huyen_ten || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phường/Xã</span>
              <span className="info-value">{park.phuong_xa_ten || 'N/A'}</span>
            </div>
          </div>
          <div className="action-buttons">
            <Link to={`/parks/${park.ma_cong_vien}`} className="btn btn-primary">
              Xem Chi Tiết
            </Link>
            <Link to="/incidents" className="btn btn-secondary">
              Quản Lý Sự Cố
            </Link>
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      {!incidentsLoading && (
        <div className="section">
          <h2>🚨 Sự Cố Gần Đây</h2>
          {recentIncidents.length > 0 ? (
            <div className="incidents-list">
              {recentIncidents.slice(0, 5).map((incident) => (
                <div 
                  key={incident.ma_bao_cao} 
                  className={`incident-item ${incident.trang_thai === 'da_xu_ly' ? 'resolved' : ''}`}
                >
                  <div>
                    <div className="incident-title">{incident.tieu_de}</div>
                    <small style={{color: '#6b7280'}}>
                      {new Date(incident.ngay_tao).toLocaleDateString('vi-VN')}
                    </small>
                  </div>
                  <span className={`incident-status ${incident.trang_thai === 'cho_xu_ly' ? 'pending' : 'resolved'}`}>
                    {incident.trang_thai === 'cho_xu_ly' ? '⏳ Chờ xử lý' : '✓ Đã xử lý'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>✨ Không có sự cố</h3>
              <p>Công viên của bạn đang hoạt động tốt</p>
            </div>
          )}
          <div className="action-buttons">
            <Link to="/incidents" className="btn btn-primary">
              Xem Tất Cả Sự Cố
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
