import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { adminAPI } from '../api';
import { formatDate } from '../constants';
import '../styles/pages/AdminListPage.css';

export default function AdminUsersPage() {
  const { data: responseData, loading, error, execute: fetchUsers } = useApi(adminAPI.getUsers, false);
  const { data: parks, execute: fetchParks } = useApi(() => adminAPI.getParks(), false);
  const [page, setPage] = useState(1);
  const [editParkModal, setEditParkModal] = useState(null);
  const [selectedPark, setSelectedPark] = useState(null);

  const users = responseData?.results || [];
  const parkList = parks?.results || [];
  const totalCount = responseData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  useEffect(() => {
    fetchUsers({ page });
    fetchParks();
  }, [page]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await adminAPI.deleteUser(id);
        fetchUsers({ page });
      } catch (err) {
        alert('Lỗi khi xóa người dùng: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleAssignPark = async (userId) => {
    if (!selectedPark) {
      alert('Vui lòng chọn công viên');
      return;
    }
    try {
      await adminAPI.updateUser(userId, { ma_cong_vien: selectedPark });
      fetchUsers({ page });
      setEditParkModal(null);
      setSelectedPark(null);
      alert('Phân công công viên thành công');
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="admin-list-page">
      <div className="page-header">
        <h1>Quản Lý Người Dùng</h1>
        <Link to="/admin/users/create" className="btn btn-primary">
          + Thêm Người Dùng
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu người dùng...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ và Tên</th>
                  <th>Email / Tên đăng nhập</th>
                  <th>Nhóm Quyền</th>
                  <th>Công Viên Quản Lý</th>
                  <th>Trạng Thái</th>
                  <th>Ngày Tham Gia</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.ma_nguoi_dung}>
                    <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>{user.ma_nguoi_dung}</td>
                    <td style={{ color: '#111827', fontWeight: '600', fontSize: '0.95rem' }}>{user.ho_ten}</td>
                    <td>
                      <div style={{ color: '#111827', fontWeight: '500', fontSize: '0.95rem' }}>{user.email}</div>
                      <small style={{ color: '#9ca3af', marginTop: '2px', fontSize: '0.85rem' }}>@{user.ten_dang_nhap}</small>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user.nhom_quyen_ten}</span>
                    </td>
                    <td>
                      {user.nhom_quyen_ten === 'Quản lý công viên' ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: '#111827', fontSize: '0.9rem' }}>
                            {user.ma_cong_vien_ten || '❌ Chưa phân công'}
                          </span>
                          <button
                            onClick={() => {
                              setEditParkModal(user.ma_nguoi_dung);
                              setSelectedPark(user.ma_cong_vien || null);
                            }}
                            className="btn btn-sm btn-ghost"
                            style={{ padding: '2px 6px', fontSize: '0.8rem' }}
                          >
                            ✏️ Sửa
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      {user.dang_hoat_dong ? (
                        <span className="badge badge-status badge-hoat-dong" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Hoạt động</span>
                      ) : (
                        <span className="badge badge-status badge-cai-tao" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Vô hiệu hóa</span>
                      )}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>{formatDate(user.ngay_tao)}</td>
                    <td className="action-cell">
                      <Link to={`/admin/users/edit/${user.ma_nguoi_dung}`} className="btn btn-sm btn-ghost">Sửa</Link>
                      <button onClick={() => handleDelete(user.ma_nguoi_dung)} className="btn btn-sm btn-danger">Xóa</button>
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
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Assign Park to Manager */}
      {editParkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>Phân Công Công Viên</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Gán công viên cho quản lý viên:
            </p>
            
            <select
              value={selectedPark || ''}
              onChange={(e) => setSelectedPark(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#111827'
              }}
            >
              <option value="">
                {parkList && parkList.length > 0 ? '-- Chọn công viên --' : 'Đang tải danh sách...'}
              </option>
              {Array.isArray(parkList) && parkList.length > 0 ? (
                parkList.map(park => (
                  <option key={park.ma_cong_vien} value={park.ma_cong_vien}>
                    {park.ten_cong_vien}
                  </option>
                ))
              ) : (
                <option disabled>Không có công viên nào</option>
              )}
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  handleAssignPark(editParkModal);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                ✅ Xác Nhận
              </button>
              <button
                onClick={() => {
                  setEditParkModal(null);
                  setSelectedPark(null);
                }}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}