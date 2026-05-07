import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../api';
import { formatDateTime, getRoleLabel, resolveRoleCode, safeArray } from '../constants';
import { useUIStore } from '../store';

export default function AdminUsersPage() {
  const { showNotification } = useUIStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const usersResponse = await adminAPI.getUsers({ ordering: '-ngay_tao' });
      setUsers(safeArray(usersResponse.data));
    } catch {
      showNotification('Khong the tai nguoi dung', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xoa nguoi dung nay?')) return;
    try {
      await adminAPI.deleteUser(id);
      showNotification('Da xoa nguoi dung', 'success');
      load();
    } catch {
      showNotification('Khong the xoa nguoi dung', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      if (user.dang_hoat_dong) await adminAPI.disableUser(user.ma_nguoi_dung);
      else await adminAPI.enableUser(user.ma_nguoi_dung);
      showNotification('Da cap nhat trang thai tai khoan', 'success');
      load();
    } catch {
      showNotification('Khong the cap nhat tai khoan', 'error');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Nguoi dung va phan quyen</div>
          <p className="page-subtitle">Trang quan tri da duoc thiet ke lai de thao tac nhanh: sua thong tin, doi role, khoa/mokhoa va xoa tai khoan.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/users/create">Them nguoi dung</Link>
      </div>

      <section className="card section-card">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ho ten</th>
                  <th>Tai khoan</th>
                  <th>Vai tro</th>
                  <th>Cong vien</th>
                  <th>Trang thai</th>
                  <th>Ngay tao</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.ma_nguoi_dung}>
                    <td>{user.ho_ten || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong>{user.ten_dang_nhap}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      {getRoleLabel(resolveRoleCode(user))}
                    </td>
                    <td>{user.ma_cong_vien_ten || '-'}</td>
                    <td>{user.dang_hoat_dong ? 'Hoat dong' : 'Da khoa'}</td>
                    <td>{formatDateTime(user.ngay_tao)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link className="btn btn-primary btn-sm" to={`/admin/users/edit/${user.ma_nguoi_dung}`}>Sua</Link>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(user)}>{user.dang_hoat_dong ? 'Khoa' : 'Mo khoa'}</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(user.ma_nguoi_dung)}>Xoa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
