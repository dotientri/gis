import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsAPI, parksAPI } from '../api';
import { hasAnyRole, PERMISSION_GROUPS } from '../constants';
import { useAuthStore, useUIStore } from '../store';

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    ten_su_kien: '',
    ma_cong_vien: user?.ma_cong_vien || '',
    loai_su_kien: 'van_hoa',
    thoi_gian_bat_dau: '',
    thoi_gian_ket_thuc: '',
    suc_chua_toi_da: '',
    mien_phi: true,
    trang_thai: 'sap_dien_ra',
    mo_ta: '',
  });

  const isEdit = Boolean(id);
  const isAdmin = hasAnyRole(user, [PERMISSION_GROUPS.ADMIN]);
  const isManager = hasAnyRole(user, [PERMISSION_GROUPS.MANAGER]);
  const managedParkId = user?.ma_cong_vien ? String(user.ma_cong_vien) : '';

  useEffect(() => {
    const load = async () => {
      try {
        const tasks = [parksAPI.getList({ limit: 100 })];
        if (isEdit) tasks.push(eventsAPI.getDetail(id));
        const [parksResponse, eventResponse] = await Promise.all(tasks);
        const parkList = parksResponse.data?.results || parksResponse.data || [];
        setParks(isManager ? parkList.filter((park) => String(park.ma_cong_vien) === managedParkId) : parkList);
        if (eventResponse) {
          const event = eventResponse.data;
          if (isManager && String(event.ma_cong_vien || '') !== managedParkId) {
            showNotification('Manager chi duoc quan ly su kien cua cong vien duoc giao', 'error');
            navigate('/events', { replace: true });
            return;
          }
          setForm({
            ten_su_kien: event.ten_su_kien || '',
            ma_cong_vien: event.ma_cong_vien || '',
            loai_su_kien: event.loai_su_kien || 'van_hoa',
            thoi_gian_bat_dau: event.thoi_gian_bat_dau?.slice(0, 16) || '',
            thoi_gian_ket_thuc: event.thoi_gian_ket_thuc?.slice(0, 16) || '',
            suc_chua_toi_da: event.suc_chua_toi_da || '',
            mien_phi: event.mien_phi ?? true,
            trang_thai: event.trang_thai || 'sap_dien_ra',
            mo_ta: event.mo_ta || '',
          });
        }
      } catch {
        showNotification('Khong the tai form su kien', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, isManager, managedParkId, navigate, showNotification]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        ma_cong_vien: isManager ? managedParkId : form.ma_cong_vien,
        suc_chua_toi_da: form.suc_chua_toi_da || null,
        thoi_gian_ket_thuc: form.thoi_gian_ket_thuc || null,
      };
      if (isEdit) {
        await eventsAPI.update(id, payload);
      } else {
        await eventsAPI.create(payload);
      }
      showNotification(isEdit ? 'Da cap nhat su kien' : 'Da tao su kien', 'success');
      navigate('/events');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Khong the luu su kien', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Cap nhat su kien' : 'Tao su kien moi'}</div>
          <p className="page-subtitle">Manager va admin dung chung mot form, nhung chi admin moi duyet va sua trang thai toan bo.</p>
        </div>
      </div>

      <section className="card section-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Ten su kien</label>
                <input required value={form.ten_su_kien} onChange={(event) => setForm((current) => ({ ...current, ten_su_kien: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Cong vien</label>
                <select required value={form.ma_cong_vien} onChange={(event) => setForm((current) => ({ ...current, ma_cong_vien: event.target.value }))} disabled={isManager}>
                  <option value="">Chon cong vien</option>
                  {parks.map((park) => <option key={park.ma_cong_vien} value={park.ma_cong_vien}>{park.ten_cong_vien}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Loai su kien</label>
                <select value={form.loai_su_kien} onChange={(event) => setForm((current) => ({ ...current, loai_su_kien: event.target.value }))}>
                  <option value="van_hoa">Van hoa</option>
                  <option value="the_thao">The thao</option>
                  <option value="le_hoi">Le hoi</option>
                  <option value="am_nhac">Am nhac</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trang thai</label>
                <select value={form.trang_thai} onChange={(event) => setForm((current) => ({ ...current, trang_thai: event.target.value }))} disabled={!isAdmin}>
                  <option value="sap_dien_ra">Sap dien ra</option>
                  <option value="dang_dien_ra">Dang dien ra</option>
                  <option value="da_ket_thuc">Da ket thuc</option>
                  <option value="huy_bo">Huy bo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bat dau</label>
                <input type="datetime-local" required value={form.thoi_gian_bat_dau} onChange={(event) => setForm((current) => ({ ...current, thoi_gian_bat_dau: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ket thuc</label>
                <input type="datetime-local" value={form.thoi_gian_ket_thuc} onChange={(event) => setForm((current) => ({ ...current, thoi_gian_ket_thuc: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Suc chua toi da</label>
                <input type="number" min="1" value={form.suc_chua_toi_da} onChange={(event) => setForm((current) => ({ ...current, suc_chua_toi_da: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Phi tham gia</label>
                <select value={String(form.mien_phi)} onChange={(event) => setForm((current) => ({ ...current, mien_phi: event.target.value === 'true' }))}>
                  <option value="true">Mien phi</option>
                  <option value="false">Co thu phi</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Mo ta</label>
              <textarea rows="5" value={form.mo_ta} onChange={(event) => setForm((current) => ({ ...current, mo_ta: event.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/events')}>Huy</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Dang luu...' : 'Luu su kien'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
