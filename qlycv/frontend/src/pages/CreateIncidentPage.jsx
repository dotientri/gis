import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../hooks';
import { incidentsAPI, parksAPI } from '../api';
import { useUIStore } from '../store';
import '../styles/pages/ParkFormPage.css'; // Tái sử dụng CSS form

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parksRes, catsRes] = await Promise.all([
          parksAPI.getList({ limit: 100 }),
          incidentsAPI.getCategories()
        ]);
        setParks(parksRes.data.results || parksRes.data);
        setCategories(catsRes.data.results || catsRes.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Hàm lấy vị trí hiện tại
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Trình duyệt không hỗ trợ định vị', 'error');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
        showNotification('Đã lấy được vị trí hiện tại', 'success');
      },
      (error) => {
        console.error(error);
        setGettingLocation(false);
        showNotification('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập.', 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const { values, handleChange, handleSubmit, isSubmitting } = useForm(
    {
      tieu_de: '',
      ma_cong_vien: '',
      ma_danh_muc: '',
      noi_dung_mo_ta: '',
      muc_do_uu_tien: 'trung_binh'
    },
    async (values) => {
      // Validate ảnh
      if (images.length === 0) {
        showNotification('Vui lòng tải lên ít nhất 1 hình ảnh sự cố', 'error');
        return;
      }

      try {
        const formData = new FormData();
        Object.keys(values).forEach(key => formData.append(key, values[key]));
        
        // Thêm ảnh
        images.forEach(file => {
          formData.append('hinh_anh_files', file);
        });

        // Thêm vị trí (nếu có)
        if (location) {
          // Backend mong đợi JSON array [lat, lng] cho field vi_tri
          formData.append('vi_tri', JSON.stringify([location.lat, location.lng]));
        }

        await incidentsAPI.create(formData);
        showNotification('Gửi báo cáo thành công!', 'success');
        navigate('/incidents');
      } catch (err) {
        showNotification('Lỗi khi gửi báo cáo', 'error');
      }
    }
  );

  if (loading) return <div className="spinner">Đang tải...</div>;

  return (
    <div className="park-form-page">
      <div className="form-header">
        <h1>Báo Cáo Sự Cố</h1>
        <p>Gửi thông tin sự cố để ban quản lý xử lý kịp thời</p>
      </div>

      <form onSubmit={handleSubmit} className="park-form">
        <div className="form-section">
          <div className="form-group">
            <label>Tiêu Đề *</label>
            <input type="text" name="tieu_de" value={values.tieu_de} onChange={handleChange} required placeholder="Ví dụ: Ghế đá bị gãy, Đèn đường hỏng..." />
          </div>

          <div className="form-row">
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
              <label>Loại Sự Cố *</label>
              <select name="ma_danh_muc" value={values.ma_danh_muc} onChange={handleChange} required>
                <option value="">-- Chọn loại sự cố --</option>
                {categories.map(c => (
                  <option key={c.ma_danh_muc} value={c.ma_danh_muc}>{c.ten_danh_muc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Mô Tả Chi Tiết *</label>
            <textarea name="noi_dung_mo_ta" value={values.noi_dung_mo_ta} onChange={handleChange} rows={4} required />
          </div>

          <div className="form-group">
            <label>Hình Ảnh Minh Chứng (Bắt buộc ít nhất 1 ảnh) *</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="file-input" />
            
            <div className="image-preview-list" style={{display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap'}}>
              {images.map((file, idx) => (
                <div key={idx} style={{width: '80px', height: '80px', position: 'relative', border: '1px solid #ddd'}}>
                  <img src={URL.createObjectURL(file)} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  <button type="button" onClick={() => handleRemoveImage(idx)} style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', width: '20px', height: '20px', cursor: 'pointer'}}>×</button>
                </div>
              ))}
            </div>
            {images.length === 0 && <span className="error" style={{fontSize: '12px'}}>⚠ Cần ít nhất 1 hình ảnh</span>}
          </div>

          <div className="form-group">
            <label>Vị Trí Sự Cố</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <button type="button" onClick={handleGetLocation} className="btn btn-secondary" disabled={gettingLocation}>
                {gettingLocation ? 'Đang lấy vị trí...' : '📍 Lấy vị trí hiện tại của tôi'}
              </button>
              {location && (
                <span style={{color: 'green', fontSize: '14px'}}>
                  ✓ Đã lưu: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              )}
            </div>
            <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
              Việc cung cấp vị trí chính xác giúp nhân viên dễ dàng tìm thấy sự cố hơn.
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/incidents')} className="btn btn-ghost btn-large">Hủy</button>
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
          </button>
        </div>
      </form>
    </div>
  );
}