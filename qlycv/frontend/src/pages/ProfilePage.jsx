import { useState } from 'react';
import { authAPI } from '../api';
import { getRoleLabel, resolveRoleCode } from '../constants';
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
          <p className="page-subtitle">Quản lý thông tin cá nhân, vai trò hiện tại và đổi mật khẩu an toàn.</p>
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
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
