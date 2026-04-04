import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../store';
import { formatDate } from '../constants';
import '../styles/pages/ParkListPage.css';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuthStore();
  const { showNotification } = useUIStore();

  // Phân quyền: Chỉ Admin mới có quyền Sửa/Xóa/Duyệt
  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/su-kien-cong-vien/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data.results || data);
    } catch (e) {
      console.error(e);
      showNotification('Lỗi tải danh sách sự kiện', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEvents();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
    try {
      await fetch(`/api/su-kien-cong-vien/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showNotification('Đã xóa sự kiện', 'success');
      fetchEvents();
    } catch (e) {
      showNotification('Lỗi khi xóa', 'error');
    }
  };

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/su-kien-cong-vien/${id}/`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ da_duyet: true })
      });
      showNotification('Đã duyệt sự kiện', 'success');
      fetchEvents();
    } catch (e) {
      showNotification('Lỗi khi duyệt', 'error');
    }
  };

  return (
    <div className="park-list-page">
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
        .sidebar *, aside *, nav *, [class*="sidebar"] * { color: #111827 !important; text-shadow: none !important; }
        .sidebar a:hover, aside a:hover, .nav-link:hover, .pro-menu-item:hover { background-color: #eff6ff !important; color: #2563eb !important; }

        /* ACTIVE STATE */
        .sidebar .active, a[aria-current="page"] { background-color: #e5e7eb !important; color: #000000 !important; font-weight: 700 !important; box-shadow: inset 4px 0 0 #3b82f6 !important; }
        .sidebar .active *, .sidebar .selected *, [aria-current="page"] * { color: #000000 !important; }
        
        .park-list-page { background-color: #f3f4f6 !important; background-image: none !important; padding: 20px; min-height: 100vh; }
        .parks-table { background-color: #ffffff !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; border: 1px solid #e5e7eb; width: 100%; }
        .parks-table thead tr { background-color: #e5e7eb !important; }
        .parks-table th { color: #111827 !important; font-weight: 700 !important; padding: 16px !important; text-align: left; }
        .parks-table tbody tr { border-bottom: 1px solid #e5e7eb !important; }
        .parks-table tbody tr:hover { background-color: #f9fafb !important; }
        .parks-table td { color: #374151 !important; padding: 16px !important; vertical-align: middle; }
        .page-header h1 { color: #111827 !important; font-weight: 800; margin: 0; }
        .table-responsive { background: #fff; }
      `}</style>
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div>
          <h1>Quản Lý Sự Kiện</h1>
          <p style={{color: '#6b7280', margin: '5px 0 0 0'}}>Theo dõi và kiểm duyệt các sự kiện tại công viên</p>
        </div>
        <Link to="/events/create" className="btn btn-primary btn-lg">+ Tạo Sự Kiện</Link>
      </div>

      {loading ? (
        <div className="spinner">Đang tải...</div>
      ) : (
        <div className="table-responsive">
          <table className="parks-table">
            <thead>
              <tr>
                <th>Sự Kiện</th>
                <th>Công Viên</th>
                <th>Phân Loại</th>
                <th>Bắt Đầu</th>
                <th>Trạng Thái</th>
                <th>Kiểm Duyệt</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.ma_su_kien}>
                  <td><strong>{event.ten_su_kien}</strong></td>
                  <td>{event.cong_vien_ten}</td>
                  <td>{event.loai_su_kien === 'van_hoa' ? 'Văn hóa' : event.loai_su_kien === 'the_thao' ? 'Thể thao' : event.loai_su_kien === 'le_hoi' ? 'Lễ hội' : 'Khác'}</td>
                  <td>{formatDate(event.thoi_gian_bat_dau)}</td>
                  <td>
                    <span className={`badge badge-${event.trang_thai === 'sap_dien_ra' ? 'info' : event.trang_thai === 'dang_dien_ra' ? 'success' : event.trang_thai === 'huy_bo' ? 'danger' : 'unknown'}`}>
                      {event.trang_thai === 'sap_dien_ra' ? 'Sắp diễn ra' : event.trang_thai === 'dang_dien_ra' ? 'Đang diễn ra' : event.trang_thai === 'huy_bo' ? 'Hủy bỏ' : 'Đã kết thúc'}
                    </span>
                  </td>
                  <td>
                    {event.da_duyet ? (
                      <span className="badge badge-success">Đã duyệt</span>
                    ) : (
                      <span className="badge badge-warning">Chờ duyệt</span>
                    )}
                  </td>
                  <td className="action-cell" style={{display: 'flex', gap: '8px'}}>
                    {isAdmin && !event.da_duyet && (
                      <button onClick={() => handleApprove(event.ma_su_kien)} className="btn btn-sm btn-secondary">Duyệt</button>
                    )}
                    {/* Nút sửa xóa chỉ hiển thị với admin */}
                    {isAdmin && (
                      <>
                        <Link to={`/events/${event.ma_su_kien}/edit`} className="btn btn-sm btn-ghost">Sửa</Link>
                        <button onClick={() => handleDelete(event.ma_su_kien)} className="btn btn-sm btn-danger">Xóa</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>Chưa có sự kiện nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
