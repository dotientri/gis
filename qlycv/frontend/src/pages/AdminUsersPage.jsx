import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { adminAPI } from '../api';
import { formatDate } from '../constants';
import '../styles/pages/AdminListPage.css';

export default function AdminUsersPage() {
  const { data: responseData, loading, error, execute: fetchUsers } = useApi(adminAPI.getUsers, false);
  const [page, setPage] = useState(1);

  const users = responseData?.results || [];
  const totalCount = responseData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  useEffect(() => {
    fetchUsers({ page });
  }, [page]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await adminAPI.deleteUser(id);
        fetchUsers({ page }); // Tải lại danh sách
      } catch (err) {
        alert('Lỗi khi xóa người dùng: ' + (err.response?.data?.detail || err.message));
      }
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
        <div className="spinner">Đang tải...</div>
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
                  <th>Trạng Thái</th>
                  <th>Ngày Tham Gia</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.ma_nguoi_dung}>
                    <td>{user.ma_nguoi_dung}</td>
                    <td>{user.ho_ten}</td>
                    <td>
                      <div>{user.email}</div>
                      <small>{user.ten_dang_nhap}</small>
                    </td>
                    <td>
                      <span className="badge badge-info">{user.nhom_quyen_ten}</span>
                    </td>
                    <td>
                      {user.dang_hoat_dong ? (
                        <span className="badge badge-status badge-hoat-dong">Hoạt động</span>
                      ) : (
                        <span className="badge badge-status badge-cai-tao">Vô hiệu hóa</span>
                      )}
                    </td>
                    <td>{formatDate(user.ngay_tao)}</td>
                    <td className="action-cell">
                      <Link to={`/admin/users/edit/${user.ma_nguoi_dung}`} className="btn btn-sm btn-ghost">Sửa</Link>
                      <button onClick={() => handleDelete(user.ma_nguoi_dung)} className="btn btn-sm btn-danger">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* TODO: Thêm component phân trang ở đây */}
        </>
      )}
    </div>
  );
}