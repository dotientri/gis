import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../hooks';
import { amenitiesAPI, parksAPI } from '../api';
import { useUIStore } from '../store';
import '../styles/pages/ParkFormPage.css'; // Tái sử dụng CSS form

export default function CreateAmenityPage() {
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parksRes, typesRes] = await Promise.all([
          parksAPI.getList({ limit: 100 }),
          amenitiesAPI.getTypes()
        ]);
        setParks(parksRes.data.results || parksRes.data);
        setTypes(typesRes.data.results || typesRes.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { values, handleChange, handleSubmit, isSubmitting } = useForm(
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

        await amenitiesAPI.create(formData);
        showNotification('Thêm tiện ích thành công!', 'success');
        navigate('/amenities');
      } catch (err) {
        showNotification('Lỗi khi thêm tiện ích', 'error');
      }
    }
  );

  if (loading) return <div className="spinner">Đang tải...</div>;

  return (
    <div className="park-form-page">
      <div className="form-header">
        <h1>Thêm Tiện Ích Mới</h1>
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
          <button type="button" onClick={() => navigate('/amenities')} className="btn btn-ghost btn-large">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Thêm Mới'}
          </button>
        </div>
      </form>
    </div>
  );
}