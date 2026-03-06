import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { amenitiesAPI, parksAPI } from '../api';
import { useAuthStore } from '../store';
import '../styles/pages/ParkListPage.css'; // Tái sử dụng CSS của trang danh sách công viên

export default function AmenitiesPage() {
  const { data: responseData, loading, execute: fetchAmenities } = useApi(amenitiesAPI.getList, false);
  const { data: parksData, execute: fetchParks } = useApi(parksAPI.getList, false);
  const { data: typesData, execute: fetchTypes } = useApi(amenitiesAPI.getTypes, false);
  
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ ma_cong_vien: '', ma_loai_tien_ich: '' });
  const { user } = useAuthStore();

  const amenities = responseData?.results || [];
  const totalCount = responseData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;
  const parks = parksData?.results || [];
  const types = typesData?.results || typesData || [];

  // Kiểm tra quyền quản lý
  const canManage = user && (
    user.ten_dang_nhap === 'admin' || 
    ['QUAN_TRI', 'QUAN_LY_CV', 'BIEN_TAP_GIS'].includes(user.nhom_quyen_code)
  );

  useEffect(() => {
    fetchParks({ limit: 100 });
    fetchTypes();
  }, []);

  useEffect(() => {
    const params = {
      page,
      limit: 20,
      ma_cong_vien: filters.ma_cong_vien || undefined,
      ma_loai_tien_ich: filters.ma_loai_tien_ich || undefined,
    };
    fetchAmenities(params);
  }, [page, filters]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tiện ích này?')) {
      try {
        await amenitiesAPI.delete(id);
        fetchAmenities({ page, limit: 20, ...filters });
      } catch (err) {
        alert('Lỗi khi xóa tiện ích');
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  return (
    <div className="park-list-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Quản Lý Tiện Ích</h1>
            <p className="subtitle">Danh sách tiện ích tại các công viên</p>
          </div>
          {canManage && (
            <Link to="/amenities/create" className="btn btn-primary btn-lg">
              Thêm Tiện Ích
            </Link>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <select
            name="ma_cong_vien"
            value={filters.ma_cong_vien}
            onChange={handleFilterChange}
            className="form-select"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
          >
            <option value="">-- Tất cả công viên --</option>
            {parks.map(p => (
              <option key={p.ma_cong_vien} value={p.ma_cong_vien}>{p.ten_cong_vien}</option>
            ))}
          </select>

          <select
            name="ma_loai_tien_ich"
            value={filters.ma_loai_tien_ich}
            onChange={handleFilterChange}
            className="form-select"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
          >
            <option value="">-- Tất cả loại tiện ích --</option>
            {types.map(t => (
              <option key={t.ma_loai_tien_ich} value={t.ma_loai_tien_ich}>{t.ten_loai}</option>
            ))}
          </select>
        </div>

        <div className="results-info">
          {totalCount > 0 && <span>Tìm thấy <strong>{totalCount}</strong> tiện ích</span>}
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : (
        <div className="table-responsive">
          <table className="parks-table">
            <thead>
              <tr>
                <th>Công Viên</th>
                <th>Loại Tiện Ích</th>
                <th>Số Lượng</th>
                <th>Tình Trạng</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {amenities.map((item) => (
                <tr key={item.ma_tien_ich}>
                  <td><strong>{item.cong_vien_ten}</strong></td>
                  <td>{item.loai_tien_ich_ten}</td>
                  <td>{item.so_luong}</td>
                  <td>
                    <span className={`badge badge-${item.tinh_trang === 'tot' ? 'success' : item.tinh_trang === 'kem' ? 'danger' : 'warning'}`}>
                      {item.tinh_trang === 'tot' ? 'Tốt' : item.tinh_trang === 'kha' ? 'Khá' : item.tinh_trang === 'trung_binh' ? 'Trung bình' : 'Kém'}
                    </span>
                  </td>
                  <td>
                    {item.dang_su_dung ? (
                      <span className="badge badge-success">Đang sử dụng</span>
                    ) : (
                      <span className="badge badge-danger">Ngưng sử dụng</span>
                    )}
                  </td>
                  <td className="action-cell">
                    {canManage && (
                      <div className="action-buttons">
                        <Link to={`/amenities/${item.ma_tien_ich}/edit`} className="btn btn-sm btn-ghost">Sửa</Link>
                        <button onClick={() => handleDelete(item.ma_tien_ich)} className="btn btn-sm btn-danger">Xóa</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {amenities.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
