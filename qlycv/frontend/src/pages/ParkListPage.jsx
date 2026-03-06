import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { parksAPI } from '../api';
import { useFilterStore, useAuthStore } from '../store';
import '../styles/pages/ParkListPage.css';

export default function ParkListPage() {
  const { data: responseData, loading, execute: fetchParks } = useApi(parksAPI.getList, false);
  const [page, setPage] = useState(1);
  const { filters, setFilter } = useFilterStore();
  const { user } = useAuthStore();
  const [sortBy, setSortBy] = useState('ten_cong_vien');
  const [sortOrder, setSortOrder] = useState('asc');

  const parks = responseData?.results || [];
  const totalCount = responseData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  // Kiểm tra quyền quản lý công viên
  const canManageParks = user && (
    user.ten_dang_nhap === 'admin' || // Admin luôn có quyền
    ['QUAN_TRI', 'QUAN_LY_CV', 'BIEN_TAP_GIS'].includes(user.nhom_quyen_code)
  );

  const { search, maLoai, maTrangThai } = filters;

  const loadData = useCallback(() => {
    const params = {
      page,
      limit: 20,
      search: search || undefined,
      ma_loai: maLoai || undefined,
      ma_trang_thai: maTrangThai || undefined,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
    };
    fetchParks(params);
  }, [page, search, maLoai, maTrangThai, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchValue = formData.get('search');
    setFilter('search', searchValue);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công viên này?')) {
      try {
        await parksAPI.delete(id);
        loadData(); // Tải lại danh sách sau khi xóa
      } catch (err) {
        console.error(err);
        alert('Lỗi khi xóa công viên');
      }
    }
  };

  // Safe getter functions
  const getTrangThaiName = (trangThai) => {
    if (!trangThai) return 'Chưa xác định';
    if (typeof trangThai === 'object') {
      return trangThai.mo_ta || trangThai.ten_trang_thai || 'Không rõ';
    }
    return trangThai;
  };

  const getTrangThaiCode = (trangThai) => {
    if (!trangThai) return 'unknown';
    if (typeof trangThai === 'object') {
      const code = trangThai.ten_trang_thai || trangThai.ma_code || 'unknown';
      return String(code).toLowerCase().replace(/ /g, '-');
    }
    return String(trangThai).toLowerCase().replace(/ /g, '-');
  };

  const getLoaiName = (loai) => {
    if (!loai) return 'Không xác định';
    if (typeof loai === 'object') {
      return loai.ten_loai || loai.name || 'Không xác định';
    }
    return loai;
  };

  const getQuanHuyenName = (quanHuyen) => {
    if (!quanHuyen) return 'Chưa xác định';
    if (typeof quanHuyen === 'object') {
      return quanHuyen.ten_quan_huyen || quanHuyen.name || 'Chưa xác định';
    }
    return quanHuyen;
  };

  return (
    <div className="park-list-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Danh Sách Công Viên</h1>
            <p className="subtitle">Khám phá tất cả công viên trong thành phố</p>
          </div>
          {canManageParks && (
            <Link to="/parks/create" className="btn btn-primary btn-lg">
              Thêm Công Viên
            </Link>
          )}
        </div>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              name="search"
              placeholder="Tìm kiếm theo tên công viên..."
              defaultValue={filters.search || ''}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">
              Tìm
            </button>
          </div>
        </form>

        <div className="filter-buttons">
          <button
            className={`btn btn-sm ${!filters.search ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('search', '')}
          >
            Tất cả
          </button>
        </div>

        <div className="results-info">
          {totalCount > 0 && <span>Tìm thấy <strong>{totalCount}</strong> công viên</span>}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải danh sách công viên...</p>
        </div>
      ) : parks && parks.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="parks-table">
              <thead>
                <tr>
                  <th className="clickable" onClick={() => handleSort('ten_cong_vien')}>
                    <div className="header-cell">
                      <span>Tên Công Viên</span>
                      {sortBy === 'ten_cong_vien' && <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th className="clickable" onClick={() => handleSort('dien_tich_m2')}>
                    <div className="header-cell">
                      <span>Diện Tích</span>
                      {sortBy === 'dien_tich_m2' && <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th>Quận Huyện</th>
                  <th>Loại</th>
                  <th>Số Cây</th>
                  <th>Trạng Thái</th>
                  <th className="text-center">Đánh Giá</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {parks.map((park) => (
                  <tr key={park.ma_cong_vien || park.id} className="park-row">
                    <td className="park-name-cell">
                      <div className="park-name-wrapper">
                        {park.anh_dai_dien && (
                          <img 
                            src={park.anh_dai_dien} 
                            alt={park.ten_cong_vien} 
                            className="park-thumbnail"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <strong className="park-title">{park.ten_cong_vien || park.tens || 'Chưa xác định'}</strong>
                          {park.dia_chi && <small className="park-address">{park.dia_chi}</small>}
                        </div>
                      </div>
                    </td>
                    <td className="numeric">
                      {park.dien_tich_m2 ? `${(park.dien_tich_m2 / 10000).toFixed(2)} ha` : '—'}
                    </td>
                    <td>
                      <span className="text-nowrap">{getQuanHuyenName(park.quan_huyen_ten || park.ma_quan_huyen)}</span>
                    </td>
                    <td>
                      <span className="badge badge-info badge-sm">
                        {getLoaiName(park.loai_ten || park.ma_loai)}
                      </span>
                    </td>
                    <td className="text-center">
                      {park.cay_so_luong || 0}
                    </td>
                    <td>
                      <span className={`badge badge-status badge-${getTrangThaiCode(park.ma_trang_thai)}`}>
                        {getTrangThaiName(park.ma_trang_thai)}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="rating-cell">
                        <span className="rating-score">
                          {park.diem_trung_binh ? `${park.diem_trung_binh.toFixed(1)}` : '—'}
                        </span>
                        <small className="rating-count">
                          ({park.so_luot_danh_gia || 0})
                        </small>
                      </div>
                    </td>
                    <td className="action-cell">
                      {canManageParks && (
                        <div className="action-buttons">
                          <Link 
                            to={`/parks/${park.ma_cong_vien || park.id}/edit`} 
                            className="btn btn-sm btn-ghost"
                            title="Chỉnh sửa"
                          >
                            Sửa
                          </Link>
                          <button
                            onClick={() => handleDelete(park.ma_cong_vien || park.id)}
                            className="btn btn-sm btn-danger"
                            title="Xóa"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-section">
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost btn-sm"
                  title="Trang trước"
                >
                  ← Trước
                </button>
                
                <span className="page-info">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
                </span>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-ghost btn-sm"
                  title="Trang sau"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h2>Chưa có công viên nào</h2>
          <p>Hãy tạo công viên đầu tiên để bắt đầu</p>
          {canManageParks && (
            <Link to="/parks/create" className="btn btn-primary btn-lg">
              Tạo công viên đầu tiên
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
