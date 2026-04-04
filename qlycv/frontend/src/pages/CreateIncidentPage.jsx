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
  const [nearestPark, setNearestPark] = useState(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parksRes, catsRes] = await Promise.all([
          parksAPI.getList({ limit: 100 }),
          incidentsAPI.getCategories()
        ]);
        setParks(parksRes.data.results || parksRes.data || []);
        const categoriesData = catsRes.data?.results || catsRes.data || [];
        console.log('Categories loaded:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        showNotification('Lỗi tải dữ liệu. Vui lòng thử lại.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  // Hàm lấy vị trí hiện tại
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Trình duyệt không hỗ trợ định vị', 'error');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        
        // Tìm công viên gần nhất
        if (parks.length > 0) {
          let nearestParkData = null;
          let minDistance = Infinity;
          
          parks.forEach(park => {
            if (park.toa_do_trung_tam && Array.isArray(park.toa_do_trung_tam) && park.toa_do_trung_tam.length >= 2) {
              const parkLat = park.toa_do_trung_tam[0];
              const parkLng = park.toa_do_trung_tam[1];
              
              // Công thức Haversine để tính khoảng cách
              const R = 6371; // km
              const dLat = (parkLat - lat) * Math.PI / 180;
              const dLng = (parkLng - lng) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(lat * Math.PI / 180) * Math.cos(parkLat * Math.PI / 180) *
                        Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distance = R * c;
              
              if (distance < minDistance) {
                minDistance = distance;
                nearestParkData = park;
              }
            }
          });
          
          if (nearestParkData) {
            setNearestPark(nearestParkData);
            setAddress(nearestParkData.dia_chi || 'Chưa có thông tin địa chỉ');
          } else {
            setAddress('Không tìm thấy công viên gần nhất');
          }
        }
        
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
        
        // Thêm địa chỉ
        if (address) {
          formData.append('dia_chi', address);
        }

        await incidentsAPI.create(formData);
        showNotification('Gửi báo cáo thành công!', 'success');
        navigate('/incidents');
      } catch (err) {
        console.error("Lỗi khi gửi báo cáo:", err);
        // Hiển thị chi tiết lỗi từ server nếu có để dễ debug
        const message = err.response?.data?.detail || err.response?.data?.error || 'Lỗi khi gửi báo cáo. Vui lòng thử lại.';
        showNotification(message, 'error');
      }
    }
  );

  if (loading) return <div className="spinner">Đang tải...</div>;

  return (
    <div className="park-form-page">
      {/* LIGHT THEME FORCE STYLE */}
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { background-color: #f3f4f6 !important; color: #111827 !important; height: 100%; }
        
        /* FIX BACKGROUND */
        .park-form-page { 
            background-color: #f3f4f6 !important; 
            background: #f3f4f6 !important;
            background-image: none !important;
            min-height: 100vh; 
        }
        
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
                {categories && categories.length > 0 ? (
                  categories.map(c => (
                    <option key={c.ma_danh_muc || c.id} value={c.ma_danh_muc || c.id}>
                      {c.ten_danh_muc || c.name || 'Không xác định'}
                    </option>
                  ))
                ) : (
                  <option disabled>Đang tải loại sự cố...</option>
                )}
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

          <div className="form-group">
            <label>Địa Chỉ (Tự động từ công viên gần nhất)</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Địa chỉ sẽ tự động cập nhật khi bạn lấy vị trí"
              style={{lineHeight: '1.5', borderColor: address ? '#22c55e' : '#d1d5db'}}
              disabled={!location}
            />
            {nearestPark && (
              <small style={{color: '#16a34a', marginTop: '5px', display: 'block'}}>
                📍 Công viên gần nhất: <strong>{nearestPark.ten_cong_vien}</strong>
              </small>
            )}
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