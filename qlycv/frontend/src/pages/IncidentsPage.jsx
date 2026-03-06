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

  const incidents = responseData?.results || [];
  const totalCount = responseData?.count || 0;

  // Kiểm tra quyền quản lý (Admin hoặc Quản lý công viên)
  const canManage = user && (
    user.ten_dang_nhap === 'admin' || 
    ['QUAN_TRI', 'QUAN_LY_CV'].includes(user.nhom_quyen_code)
  );

  useEffect(() => {
    fetchIncidents({ page, limit: 20, ordering: '-ngay_tao' });
  }, [page]);

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
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Danh Sách Sự Cố</h1>
            <p className="subtitle">Theo dõi và xử lý các vấn đề tại công viên</p>
          </div>
          <Link to="/incidents/create" className="btn btn-primary btn-lg">
            + Báo Cáo Mới
          </Link>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
