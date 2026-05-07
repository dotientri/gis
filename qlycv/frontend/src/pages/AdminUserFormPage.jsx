import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI, parksAPI, permissionGroupsAPI } from '../api';
import PasswordField from '../components/Form/PasswordField';
import { useUIStore } from '../store';

export default function AdminUserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [roles, setRoles] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    ten_dang_nhap: '',
    email: '',
    ho_ten: '',
    mat_khau: '',
    ma_nhom_quyen: '',
    ma_cong_vien: '',
    dang_hoat_dong: true,
  });

  const isEdit = Boolean(id);
  const selectedRole = roles.find((role) => String(role.ma_nhom_quyen) === String(form.ma_nhom_quyen));
  const isManagerRole = selectedRole?.ten_nhom === 'QUAN_LY';

  useEffect(() => {
    const load = async () => {
      try {
        const tasks = [permissionGroupsAPI.getList(), parksAPI.getList({ limit: 100 })];
        if (isEdit) tasks.push(adminAPI.getUser(id));
        const [rolesResponse, parksResponse, userResponse] = await Promise.all(tasks);
        setRoles(rolesResponse.data.results || rolesResponse.data || []);
        setParks(parksResponse.data.results || []);
        if (userResponse) {
          const user = userResponse.data;
          setForm({
            ten_dang_nhap: user.ten_dang_nhap || '',
            email: user.email || '',
            ho_ten: user.ho_ten || '',
            mat_khau: '',
            ma_nhom_quyen: user.ma_nhom_quyen || '',
            ma_cong_vien: user.ma_cong_vien || '',
            dang_hoat_dong: user.dang_hoat_dong ?? true,
          });
        }
      } catch {
        showNotification('Khong the tai du lieu nguoi dung', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, showNotification]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ten_dang_nhap: form.ten_dang_nhap,
        email: form.email,
        ho_ten: form.ho_ten,
        ma_nhom_quyen: Number(form.ma_nhom_quyen),
        ma_cong_vien: form.ma_cong_vien ? Number(form.ma_cong_vien) : null,
        dang_hoat_dong: form.dang_hoat_dong,
      };

      if (isEdit) {
        await adminAPI.updateUser(id, payload);
      } else {
        await adminAPI.createUser({ ...payload, mat_khau: form.mat_khau });
      }

      showNotification(isEdit ? 'Da cap nhat nguoi dung' : 'Da tao nguoi dung', 'success');
      navigate('/admin/users');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Khong the luu nguoi dung', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Cap nhat nguoi dung' : 'Them nguoi dung moi'}</div>
          <p className="page-subtitle">Form quan tri da duoc don gon, giu lai du lieu can thiet de tao va cap nhat tai khoan.</p>
        </div>
      </div>

      <section className="card section-card">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Ten dang nhap</label>
                <input required disabled={isEdit} value={form.ten_dang_nhap} onChange={(event) => setForm((current) => ({ ...current, ten_dang_nhap: event.target.value }))} />
              </div>
              {!isEdit && (
                <PasswordField label="Mat khau" required value={form.mat_khau} onChange={(event) => setForm((current) => ({ ...current, mat_khau: event.target.value }))} autoComplete="new-password" />
              )}
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ho ten</label>
                <input value={form.ho_ten} onChange={(event) => setForm((current) => ({ ...current, ho_ten: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Vai tro</label>
                <select required value={form.ma_nhom_quyen} onChange={(event) => setForm((current) => ({ ...current, ma_nhom_quyen: event.target.value, ma_cong_vien: roles.find((role) => String(role.ma_nhom_quyen) === event.target.value)?.ten_nhom === 'QUAN_LY' ? current.ma_cong_vien : '' }))}>
                  <option value="">Chon vai tro</option>
                  {roles.map((role) => <option key={role.ma_nhom_quyen} value={role.ma_nhom_quyen}>{role.ten_nhom}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Cong vien duoc giao {isManagerRole ? '(bat buoc cho manager)' : ''}</label>
                <select value={form.ma_cong_vien} onChange={(event) => setForm((current) => ({ ...current, ma_cong_vien: event.target.value }))}>
                  <option value="">{isManagerRole ? 'Chon dung 1 cong vien' : 'Khong gan cong vien'}</option>
                  {parks.map((park) => <option key={park.ma_cong_vien} value={park.ma_cong_vien}>{park.ten_cong_vien}</option>)}
                </select>
              </div>
            </div>
            {isManagerRole && <div className="notice">Manager chi duoc quan ly duy nhat 1 cong vien. Backend se tu choi neu cong vien do da co manager khac.</div>}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.dang_hoat_dong} onChange={(event) => setForm((current) => ({ ...current, dang_hoat_dong: event.target.checked }))} style={{ width: 'auto' }} />
              Tai khoan dang hoat dong
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/users')}>Huy</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Dang luu...' : 'Luu nguoi dung'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

