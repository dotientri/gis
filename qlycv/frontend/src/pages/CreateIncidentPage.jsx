import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI, parksAPI } from '../api';
import { hasAnyRole, PERMISSION_GROUPS } from '../constants';
import { useAuthStore, useUIStore } from '../store';

function getApiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.error === 'string' && data.error) return data.error;
  if (typeof data.detail === 'string' && data.detail) return data.detail;

  const firstField = Object.values(data).find((value) => Array.isArray(value) ? value[0] : typeof value === 'string');
  if (Array.isArray(firstField) && firstField[0]) return firstField[0];
  if (typeof firstField === 'string' && firstField) return firstField;
  return fallback;
}

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    tieu_de: '',
    ma_cong_vien: '',
    ma_danh_muc: '',
    noi_dung_mo_ta: '',
    muc_do_uu_tien: 'trung_binh',
    dia_chi: '',
  });
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [parksResponse, categoriesResponse] = await Promise.all([
          parksAPI.getList({ limit: 100 }),
          incidentsAPI.getCategories(),
        ]);
        setParks(parksResponse.data.results || []);
        setCategories(categoriesResponse.data.results || categoriesResponse.data || []);
      } catch (error) {
        showNotification('Khong the tai du lieu tao su co', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showNotification]);

  const selectedPark = useMemo(() => parks.find((item) => String(item.ma_cong_vien) === String(form.ma_cong_vien)), [form.ma_cong_vien, parks]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Trinh duyet khong ho tro dinh vi', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = [position.coords.latitude, position.coords.longitude];
        setLocation(nextLocation);
        showNotification('Da lay vi tri hien tai', 'success');
      },
      () => showNotification('Khong the lay vi tri hien tai', 'error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (images.length === 0) {
      showNotification('Can it nhat mot hinh anh minh chung', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (location) {
        payload.append('vi_tri', JSON.stringify(location));
      }
      images.forEach((file) => payload.append('hinh_anh_files', file));
      await incidentsAPI.create(payload);
      showNotification('Da tao bao cao su co', 'success');
      navigate(hasAnyRole(user, [PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.ADMIN]) ? '/incidents' : '/profile');
    } catch (error) {
      showNotification(getApiErrorMessage(error, 'Khong the tao su co'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Bao cao su co moi</div>
          <p className="page-subtitle">Form duoc thiet ke lai theo luong hien truong: mo ta ngan, xac dinh vi tri, chon cong vien va tai minh chung.</p>
        </div>
      </div>

      <section className="card section-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Tieu de</label>
                <input required value={form.tieu_de} onChange={(event) => setForm((current) => ({ ...current, tieu_de: event.target.value }))} placeholder="Vi du: den chieu sang hu hong" />
              </div>
              <div className="form-group">
                <label>Muc do uu tien</label>
                <select value={form.muc_do_uu_tien} onChange={(event) => setForm((current) => ({ ...current, muc_do_uu_tien: event.target.value }))}>
                  <option value="thap">Thap</option>
                  <option value="trung_binh">Trung binh</option>
                  <option value="cao">Cao</option>
                  <option value="khan_cap">Khan cap</option>
                </select>
              </div>
              <div className="form-group">
                <label>Cong vien</label>
                <select required value={form.ma_cong_vien} onChange={(event) => setForm((current) => ({ ...current, ma_cong_vien: event.target.value, dia_chi: current.dia_chi || selectedPark?.dia_chi || '' }))}>
                  <option value="">Chon cong vien</option>
                  {parks.map((park) => <option key={park.ma_cong_vien} value={park.ma_cong_vien}>{park.ten_cong_vien}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Danh muc su co</label>
                <select required value={form.ma_danh_muc} onChange={(event) => setForm((current) => ({ ...current, ma_danh_muc: event.target.value }))}>
                  <option value="">Chon danh muc</option>
                  {categories.map((category) => <option key={category.ma_danh_muc} value={category.ma_danh_muc}>{category.ten_danh_muc}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Mo ta chi tiet</label>
              <textarea rows="5" required value={form.noi_dung_mo_ta} onChange={(event) => setForm((current) => ({ ...current, noi_dung_mo_ta: event.target.value }))} placeholder="Neu ro vi tri, tac dong, muc do nguy hiem va de xuat xu ly neu co." />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Dia chi mo ta</label>
                <input value={form.dia_chi} onChange={(event) => setForm((current) => ({ ...current, dia_chi: event.target.value }))} placeholder="So nha, cong vao, khu vuc ben trong cong vien" />
              </div>
              <div className="form-group">
                <label>Vi tri GPS</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-ghost" onClick={handleCurrentLocation}>Lay vi tri hien tai</button>
                  <div className="badge">{location ? `${location[0].toFixed(5)}, ${location[1].toFixed(5)}` : 'Chua xac dinh'}</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Hinh anh minh chung</label>
              <input type="file" multiple accept="image/*" onChange={(event) => setImages(Array.from(event.target.files || []))} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {images.map((file) => <div key={`${file.name}-${file.size}`} className="badge">{file.name}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/incidents')}>Huy</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Dang gui...' : 'Gui bao cao'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
