import { useEffect, useState } from 'react';
import { authAPI, incidentsAPI } from '../api';
import PasswordField from '../components/Form/PasswordField';
import {
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_STATUS_LABELS,
  formatDateTime,
  getRoleLabel,
  getStatusColor,
  resolveRoleCode,
  safeArray,
} from '../constants';
import { useAuthStore, useUIStore } from '../store';

export default function ProfilePage() {
  const { user, setToken, setUser } = useAuthStore();
  const { showNotification } = useUIStore();
  const [profileForm, setProfileForm] = useState({
    ho_ten: user?.ho_ten || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const loadIncidentHistory = async () => {
      setHistoryLoading(true);
      try {
        const [openResponse, archivedResponse] = await Promise.all([
          incidentsAPI.getList({ mine: true, is_archived: false, ordering: '-ngay_tao' }),
          incidentsAPI.getList({ mine: true, is_archived: true, ordering: '-ngay_tao' }),
        ]);
        const ownUserId = String(user?.ma_nguoi_dung || '');
        const onlyMine = [...safeArray(openResponse.data), ...safeArray(archivedResponse.data)]
          .filter((item) => ownUserId && String(item.ma_nguoi_bao_cao || '') === ownUserId);
        setIncidentHistory(onlyMine);
      } catch {
        showNotification('Không thể tải lịch sử báo cáo', 'error');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadIncidentHistory();
  }, [showNotification, user?.ma_nguoi_dung]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await authAPI.updateProfile(profileForm);
      setUser(response.data);
      showNotification('Đã cập nhật thông tin tài khoản', 'success');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Không thể cập nhật hồ sơ', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    try {
      const response = await authAPI.changePassword(passwordForm);
      if (response.data?.token) {
        setToken(response.data.token);
      }
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      showNotification('Đã đổi mật khẩu thành công', 'success');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Không thể đổi mật khẩu', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Hồ sơ tài khoản</div>
          <p className="page-subtitle">Quản lý thông tin cá nhân, vai trò hiện tại và theo dõi lịch sử báo cáo sự cố.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card section-card">
          <div className="info-list" style={{ marginBottom: 18 }}>
            <div className="info-row"><span>Tên đăng nhập</span><strong>{user?.ten_dang_nhap}</strong></div>
            <div className="info-row"><span>Vai trò</span><strong>{getRoleLabel(resolveRoleCode(user))}</strong></div>
            <div className="info-row"><span>Công viên được giao</span><strong>{user?.ma_cong_vien_ten || user?.ma_cong_vien || 'Không áp dụng'}</strong></div>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: 16 }}>
            <div className="form-group">
              <label>Họ tên</label>
              <input value={profileForm.ho_ten} onChange={(event) => setProfileForm((current) => ({ ...current, ho_ten: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </form>
        </section>

        <section className="card section-card">
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Đổi mật khẩu</h2>
              <p className="page-subtitle">Sau khi đổi mật khẩu, phiên đăng nhập sẽ được cập nhật lại ngay.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 16 }}>
            <PasswordField label="Mật khẩu hiện tại" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} autoComplete="current-password" />
            <PasswordField label="Mật khẩu mới" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} autoComplete="new-password" />
            <PasswordField label="Xác nhận mật khẩu mới" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} autoComplete="new-password" />
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </section>
      </div>

      <section className="card section-card" style={{ marginTop: 24 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Lịch sử báo cáo sự cố</h2>
            <p className="page-subtitle">Các sự cố bạn đã gửi và trạng thái xử lý hiện tại.</p>
          </div>
        </div>

        {historyLoading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : incidentHistory.length === 0 ? (
          <div className="empty-state"><p>Bạn chưa gửi báo cáo sự cố nào.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Công viên</th>
                  <th>Ưu tiên</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th>Phụ trách</th>
                </tr>
              </thead>
              <tbody>
                {incidentHistory.map((item) => (
                  <tr key={`${item.is_archived ? 'archived' : 'open'}-${item.ma_bao_cao}`}>
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong>{item.tieu_de}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{item.noi_dung_mo_ta?.slice(0, 90) || 'Không có mô tả'}</span>
                      </div>
                    </td>
                    <td>{item.cong_vien_ten || 'N/A'}</td>
                    <td>
                      <span className="badge">
                        <span className="badge-dot" style={{ backgroundColor: getStatusColor(item.muc_do_uu_tien, 'priority') }} />
                        {INCIDENT_PRIORITY_LABELS[item.muc_do_uu_tien] || item.muc_do_uu_tien}
                      </span>
                    </td>
                    <td>
                      <span className="badge">
                        <span className="badge-dot" style={{ backgroundColor: getStatusColor(item.trang_thai, 'incident') }} />
                        {INCIDENT_STATUS_LABELS[item.trang_thai] || item.trang_thai}
                      </span>
                    </td>
                    <td>{formatDateTime(item.ngay_tao)}</td>
                    <td>{item.nguoi_phu_trach_ten || 'Chưa phân công'}</td>
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
