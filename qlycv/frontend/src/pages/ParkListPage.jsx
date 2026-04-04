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

  // Kiểm tra quyền quản lý công viên (Admin)
  const canManageParks = user && user.nhom_quyen_code === 'QUAN_TRI';

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

  // Tự động tải lại dữ liệu khi người dùng quay lại tab/trang này
  useEffect(() => {
    const refetchData = () => loadData();
    window.addEventListener('focus', refetchData);
    // Clean up
    return () => {
      window.removeEventListener('focus', refetchData);
    };
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
      {/* NUCLEAR LIGHT THEME: Ép sáng toàn bộ hệ thống */}
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
        .sidebar a:hover, aside a:hover, .nav-link:hover, .pro-menu-item:hover { 
            background-color: #eff6ff !important;
            color: #2563eb !important;
        }
        
        /* ACTIVE STATE: Xám nhạt + Chữ đen */
        .sidebar .active, .sidebar .selected, .sidebar .current, .sidebar .is-active, .sidebar .router-link-active,
        aside .active, aside .selected, aside .current, aside .is-active, aside .router-link-active,
        .nav-link.active, li.active > a, a[aria-current="page"], .pro-menu-item.active {
            background-color: #e5e7eb !important;
            color: #000000 !important;
            font-weight: 700 !important;
            box-shadow: inset 4px 0 0 #3b82f6 !important;
        }
        .sidebar .active *, .sidebar .selected *, [aria-current="page"] * { color: #000000 !important; }

        /* FIX INPUTS: Đảm bảo mọi ô nhập liệu đều sáng sủa */
        input, select, textarea, .search-input {
            background-color: #ffffff !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
        }

        /* MAIN CONTENT */
        .park-list-page { 
            background-color: #f3f4f6 !important; 
            background: #f3f4f6 !important; 
            background-image: none !important; /* Xóa gradient tối */
            padding: 20px; 
            min-height: 100vh; 
        }
        
        /* RESET CÁC KHỐI CON (Bộ lọc, bảng...) để không bị đen */
        .filters-section, .table-responsive, .pagination-section, .empty-state, .loading-container {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #111827 !important;
        }

        .parks-table { background-color: #ffffff !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        .parks-table thead tr { background-color: #e5e7eb !important; }
        .parks-table th { color: #111827 !important; font-weight: 700 !important; text-transform: uppercase; font-size: 0.85rem; padding: 16px !important; }
        
        .park-row { opacity: 1 !important; background-color: #ffffff !important; border-bottom: 1px solid #e5e7eb !important; transition: background-color 0.2s; }
        .park-row:hover { background-color: #f9fafb !important; }
        .park-row td { color: #374151 !important; vertical-align: middle !important; padding: 16px !important; }
        
        .park-title { color: #111827 !important; font-weight: 700 !important; font-size: 1rem !important; }
        .park-address { color: #6b7280 !important; font-size: 0.875rem !important; }
        .park-thumbnail { border-radius: 6px; border: 1px solid #e5e7eb; width: 60px; height: 60px; object-fit: cover; }
        
        .page-header h1 { color: #111827 !important; }
        .page-header .subtitle { color: #4b5563 !important; }
        .badge { font-weight: 600 !important; border: 1px solid transparent; }
      `}</style>
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
                  <th>Số Tiện Ích</th>
                  <th>Trạng Thái</th>
                  <th className="text-center">Đánh Giá</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {parks.map((park) => (
                  <tr 
                    key={park.ma_cong_vien || park.id} 
                    className="park-row"
                    // FIX: Ép độ trong suốt 100% để sửa lỗi mờ văn bản (Low Contrast) ngay tại thẻ dòng (tr)
                    style={{ opacity: 1, backgroundColor: '#ffffff' }}
                  >
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
                          {/* FIX: Màu chữ đen tuyệt đối và đậm để dễ nhìn */}
                          <strong className="park-title" style={{ color: '#111827', opacity: 1, fontWeight: '700' }}>
                            {park.ten_cong_vien || park.tens || 'Chưa xác định'}
                          </strong>
                          {park.dia_chi && <small className="park-address">{park.dia_chi}</small>}
                        </div>
                      </div>
                    </td>
                    {/* FIX: Hiển thị diện tích rõ ràng */}
                    <td className="numeric" style={{ color: '#111827', opacity: 1, fontWeight: '500' }}>
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
                    <td className="text-center">
                      {park.tien_ich_so_luong || 0}
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
