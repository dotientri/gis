import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '../hooks';
import { amenitiesAPI, parksAPI } from '../api';
import { useUIStore } from '../store';
import '../styles/pages/ParkFormPage.css';

export default function EditAmenityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { values, setValues, handleChange, handleSubmit, isSubmitting } = useForm(
    {
      ma_cong_vien: '',
      ma_loai_tien_ich: '',
      so_luong: 1,
      tinh_trang: 'tot',
      mo_ta: '',
      dang_su_dung: true
    },
    async (values) => {
      try {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
          formData.append(key, values[key]);
        });

        await amenitiesAPI.update(id, formData);
        showNotification('Cập nhật tiện ích thành công!', 'success');
        navigate('/amenities');
      } catch (err) {
        showNotification('Lỗi khi cập nhật tiện ích', 'error');
      }
    }
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [amenityRes, parksRes, typesRes] = await Promise.all([
          amenitiesAPI.getDetail(id),
          parksAPI.getList({ limit: 100 }),
          amenitiesAPI.getTypes()
        ]);
        
        const amenity = amenityRes.data;
        setValues({
          ma_cong_vien: amenity.ma_cong_vien,
          ma_loai_tien_ich: amenity.ma_loai_tien_ich,
          so_luong: amenity.so_luong,
          tinh_trang: amenity.tinh_trang,
          mo_ta: amenity.mo_ta || '',
          dang_su_dung: amenity.dang_su_dung
        });

        setParks(parksRes.data.results || parksRes.data);
        setTypes(typesRes.data.results || typesRes.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        showNotification('Không tìm thấy tiện ích', 'error');
        navigate('/amenities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="spinner">Đang tải...</div>;

  return (
    <div className="park-form-page">
      {/* LIGHT THEME FORCE STYLE */}
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
            color: #111827 !important;
            text-shadow: none !important;
        }
        .sidebar a:hover, aside a:hover, .nav-link:hover, .pro-menu-item:hover { 
            background-color: #eff6ff !important;
            color: #2563eb !important;
        }

        /* ACTIVE STATE */
        .sidebar .active, .sidebar .selected, .sidebar .current, .sidebar .is-active, .sidebar .router-link-active,
        aside .active, aside .selected, aside .current, aside .is-active, aside .router-link-active,
        .nav-link.active, li.active > a, a[aria-current="page"], .pro-menu-item.active {
            background-color: #e5e7eb !important;
            color: #000000 !important;
            font-weight: 700 !important;
            box-shadow: inset 4px 0 0 #3b82f6 !important;
        }
        .sidebar .active *, .sidebar .selected *, [aria-current="page"] * { color: #000000 !important; }
      `}</style>
      <div className="form-header">
        <h1>Chỉnh Sửa Tiện Ích</h1>
      </div>

      <form onSubmit={handleSubmit} className="park-form">
        <div className="form-section">
          <div className="form-group">
            <label>Công Viên *</label>
            <select name="ma_cong_vien" value={values.ma_cong_vien} onChange={handleChange} required>
              <option value="">-- Chọn công viên --</option>
              {parks.map(p => (
                <option key={p.ma_cong_vien} value={p.ma_cong_vien}>{p.ten_cong_vien}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Loại Tiện Ích *</label>
            <select name="ma_loai_tien_ich" value={values.ma_loai_tien_ich} onChange={handleChange} required>
              <option value="">-- Chọn loại tiện ích --</option>
              {types.map(t => (
                <option key={t.ma_loai_tien_ich} value={t.ma_loai_tien_ich}>{t.ten_loai}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Số Lượng *</label>
              <input type="number" name="so_luong" value={values.so_luong} onChange={handleChange} min="1" required />
            </div>

            <div className="form-group">
              <label>Tình Trạng</label>
              <select name="tinh_trang" value={values.tinh_trang} onChange={handleChange}>
                <option value="tot">Tốt</option>
                <option value="kha">Khá</option>
                <option value="trung_binh">Trung bình</option>
                <option value="kem">Kém</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Mô Tả</label>
            <textarea name="mo_ta" value={values.mo_ta} onChange={handleChange} rows={3} />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="dang_su_dung"
                checked={values.dang_su_dung}
                onChange={handleChange}
              />
              Đang sử dụng
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/amenities')} className="btn btn-ghost btn-large">Hủy</button>
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Cập Nhật'}
          </button>
        </div>
      </form>
    </div>
  );
}