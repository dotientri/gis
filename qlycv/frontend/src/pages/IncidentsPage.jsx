import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { incidentsAPI } from '../api';
import { useAuthStore, useUIStore } from '../store';
import { formatDate } from '../constants';
import '../styles/pages/ParkListPage.css';

export default function IncidentsPage() {
  const { data: responseData, loading, execute: fetchIncidents } = useApi(incidentsAPI.getList, false);
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [page, setPage] = useState(1);
  const [isArchived, setIsArchived] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const incidents = responseData?.results || [];
  const totalCount = responseData?.count || 0;

  // Kiểm tra quyền quản lý (Admin hoặc Manager)
  const canManage = user && (user.nhom_quyen_code === 'QUAN_TRI' || user.nhom_quyen_code === 'QUAN_LY');
  
  // Kiểm tra quyền xuất file (Manager hoặc Admin)
  const canExport = user && (user.nhom_quyen_code === 'QUAN_LY' || user.nhom_quyen_code === 'QUAN_TRI');

  useEffect(() => {
    fetchIncidents({ page, limit: 20, ordering: '-ngay_tao', is_archived: isArchived });
  }, [page, isArchived]);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const response = await incidentsAPI.exportExcel({ is_archived: isArchived });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `su_co_${isArchived ? 'archive_' : ''}${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('Xuất Excel thành công', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('Lỗi xuất Excel: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await incidentsAPI.updateStatus(id, newStatus);
      showNotification('Cập nhật trạng thái thành công', 'success');
      fetchIncidents({ page, limit: 20, ordering: '-ngay_tao' });
    } catch (err) {
      showNotification('Lỗi cập nhật trạng thái', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'cho_xu_ly': return <span className="badge badge-warning">Chờ xử lý</span>;
      case 'dang_xu_ly': return <span className="badge badge-info">Đang xử lý</span>;
      case 'da_xu_ly': return <span className="badge badge-success">Đã xử lý</span>;
      default: return <span className="badge badge-unknown">{status}</span>;
    }
  };

  return (
    <div className="park-list-page">
      {/* NUCLEAR LIGHT THEME */}
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { background-color: #f3f4f6 !important; color: #111827 !important; height: 100%; }
        
        /* FIX BACKGROUND CHÍNH: Xóa gradient tối */
        .park-list-page { 
            background-color: #f3f4f6 !important; 
            background: #f3f4f6 !important;
            background-image: none !important;
            padding: 20px; 
            min-height: 100vh; 
        }
        
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

        /* 4. Bảng dữ liệu nền trắng, chữ đen */
        .parks-table { background-color: #ffffff !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; border: 1px solid #e5e7eb; }
        .parks-table thead tr { background-color: #e5e7eb !important; border-bottom: none !important; }
        .parks-table th { color: #111827 !important; font-weight: 700 !important; padding: 16px !important; text-transform: uppercase; font-size: 0.85rem; }
        
        .parks-table tbody tr { background-color: #ffffff !important; border-bottom: 1px solid #e5e7eb !important; transition: background-color 0.2s; }
        .parks-table tbody tr:hover { background-color: #f9fafb !important; }
        .parks-table td { color: #374151 !important; padding: 16px !important; vertical-align: middle; }
        .parks-table td strong { color: #000000 !important; font-weight: 700 !important; }
        
        /* 5. Header & Inputs */
        .page-header { background: none !important; padding: 0 !important; margin-bottom: 24px; border: none !important; }
        .page-header h1 { color: #111827 !important; font-weight: 800; text-shadow: none; }
        .page-header .subtitle { color: #6b7280 !important; font-weight: 400; }
        
        .form-select {
          background-color: #ffffff !important;
          color: #111827 !important;
          border: 1px solid #d1d5db !important;
        }

        /* FIX CÁC KHỐI CON: Ép nền trắng */
        .results-info, .table-responsive, .loading-container {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #111827 !important;
        }
      `}</style>
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Danh Sách Sự Cố</h1>
            <p className="subtitle">Theo dõi và xử lý các vấn đề tại công viên</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {canExport && (
              <button 
                onClick={handleExportExcel}
                disabled={isExporting || incidents.length === 0}
                className="btn btn-secondary"
                title="Xuất dữ liệu ra Excel"
              >
                {isExporting ? '⏳ Đang xuất...' : '📊 Xuất Excel'}
              </button>
            )}
            <Link to="/incidents/create" className="btn btn-primary btn-lg">
              + Báo Cáo Mới
            </Link>
          </div>
        </div>

        {/* TABS: Active / History */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
          <button
            onClick={() => {
              setIsArchived(false);
              setPage(1);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: !isArchived ? '#3b82f6' : '#e5e7eb',
              color: !isArchived ? '#ffffff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: !isArchived ? '700' : '500',
              fontSize: '14px'
            }}
          >
            📍 Sự Cố Hoạt Động ({totalCount})
          </button>
          <button
            onClick={() => {
              setIsArchived(true);
              setPage(1);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: isArchived ? '#3b82f6' : '#e5e7eb',
              color: isArchived ? '#ffffff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: isArchived ? '700' : '500',
              fontSize: '14px'
            }}
          >
            📦 Lịch Sử (Đã Lưu Trữ)
          </button>
        </div>
      </div>

      <div className="results-info" style={{marginBottom: '20px'}}>
        {totalCount > 0 && <span>Tìm thấy <strong>{totalCount}</strong> báo cáo</span>}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : (
        <div className="table-responsive">
          <table className="parks-table">
            <thead>
              <tr>
                <th>Tiêu Đề</th>
                <th>Công Viên</th>
                <th>Loại</th>
                <th>Mức Độ</th>
                <th>Người Báo</th>
                <th>Ngày Tạo</th>
                <th>Trạng Thái</th>
                <th>Hình Ảnh</th>
                <th>Vị Trí</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((item) => (
                <tr key={item.ma_bao_cao}>
                  <td><strong>{item.tieu_de}</strong></td>
                  <td>{item.cong_vien_ten}</td>
                  <td>{item.danh_muc_ten}</td>
                  <td>
                    <span style={{
                      color: item.muc_do_uu_tien === 'khan_cap' ? 'red' : 
                             item.muc_do_uu_tien === 'cao' ? 'orange' : 'inherit',
                      fontWeight: item.muc_do_uu_tien === 'khan_cap' ? 'bold' : 'normal'
                    }}>
                      {item.muc_do_uu_tien === 'khan_cap' ? 'Khẩn cấp' : 
                       item.muc_do_uu_tien === 'cao' ? 'Cao' : 
                       item.muc_do_uu_tien === 'thap' ? 'Thấp' : 'Trung bình'}
                    </span>
                  </td>
                  <td>{item.ma_nguoi_bao_cao ? 'Thành viên' : 'Ẩn danh'}</td>
                  <td>{formatDate(item.ngay_tao)}</td>
                  <td>
                    {canManage ? (
                      <select 
                        value={item.trang_thai} 
                        onChange={(e) => handleStatusChange(item.ma_bao_cao, e.target.value)}
                        className="form-select"
                        style={{padding: '4px', borderRadius: '4px', fontSize: '13px'}}
                      >
                        <option value="cho_xu_ly">Chờ xử lý</option>
                        <option value="dang_xu_ly">Đang xử lý</option>
                        <option value="da_xu_ly">Đã xử lý</option>
                      </select>
                    ) : (
                      getStatusBadge(item.trang_thai)
                    )}
                  </td>
                  <td>
                    {item.url_hinh_anh && item.url_hinh_anh.length > 0 ? (
                      <a href={item.url_hinh_anh[0]} target="_blank" rel="noreferrer" style={{color: 'blue'}}>Xem ảnh</a>
                    ) : 'Không có'}
                  </td>
                  <td>
                    {item.vi_tri && item.vi_tri.length === 2 ? (
                      <a 
                        href={`https://www.google.com/maps?q=${item.vi_tri[0]},${item.vi_tri[1]}`} 
                        target="_blank" 
                        rel="noreferrer"
                        title="Xem trên Google Maps"
                        style={{color: 'blue', textDecoration: 'none'}}
                      >Xem Map</a>
                    ) : 'Không có'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
