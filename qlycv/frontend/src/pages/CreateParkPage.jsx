import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../hooks';
import { parksAPI, imagesAPI, amenitiesAPI, parkTypesAPI, districtsAPI } from '../api';
import { useUIStore } from '../store';
import '../styles/pages/ParkFormPage.css';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix lỗi icon mặc định của Leaflet trong React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component xử lý sự kiện click trên bản đồ
function LocationMarker({ setFieldValue }) {
  useMapEvents({
    click(e) {
      setFieldValue('toa_do_trung_tam_lat', e.latlng.lat.toFixed(6));
      setFieldValue('toa_do_trung_tam_lng', e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

// Component để cập nhật view bản đồ khi tọa độ thay đổi từ input
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function CreateParkPage() {
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [parkTypes, setParkTypes] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState([]); // Thêm state lưu loại tiện ích
  const [seoKeywords, setSeoKeywords] = useState(''); // State cho SEO keywords
  
  // State cho hình ảnh và tiện ích
  const [parkImages, setParkImages] = useState([]);
  // Khởi tạo state rỗng, sẽ được điền dữ liệu từ API
  const [amenities, setAmenities] = useState({});

  // Tải danh sách Loại công viên và Quận huyện
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, districtsRes, amenitiesRes] = await Promise.all([
          parkTypesAPI.getList(),
          districtsAPI.getList({ limit: 100 }),
          amenitiesAPI.getTypes() // Tải danh sách loại tiện ích
        ]);
        setParkTypes(typesRes.data.results || typesRes.data);
        setDistricts(districtsRes.data.results || districtsRes.data);
        
        // Xử lý danh sách tiện ích động
        const typesList = amenitiesRes.data.results || amenitiesRes.data;
        setAmenityTypes(typesList);
        
        const initialAmenities = {};
        typesList.forEach(type => {
          // Sử dụng ma_code làm key
          initialAmenities[type.ma_code] = { 
            checked: false, images: [], label: type.ten_loai, code: type.ma_code, 
            id_type: type.ma_loai_tien_ich, description: '', quantity: 1 
          };
        });
        setAmenities(initialAmenities);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchData();
  }, []);

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } = useForm(
    {
      tens: '',
      mo_ta: '',
      dien_tich_m2: '',
      ma_loai: '',
      ma_quan_huyen: '',
      toa_do_trung_tam_lat: '10.8231',
      toa_do_trung_tam_lng: '106.6797',
    },
    async (values) => {
      try {
        // Validate: Ít nhất 4 ảnh công viên
        if (parkImages.length < 4) {
          showNotification('Vui lòng tải lên ít nhất 4 ảnh cho công viên', 'error');
          return;
        }

        // Convert to backend format
        const parkData = {
          ten_cong_vien: values.tens, // Map đúng tên trường backend yêu cầu
          mo_ta: values.mo_ta,
          dien_tich_m2: parseFloat(values.dien_tich_m2),
          ma_loai: values.ma_loai,
          ma_quan_huyen: values.ma_quan_huyen,
          toa_do_trung_tam: [
            parseFloat(values.toa_do_trung_tam_lat),
            parseFloat(values.toa_do_trung_tam_lng),
          ],
        };

        // 1. Tạo công viên
        const response = await parksAPI.create(parkData);
        // Kiểm tra kỹ cấu trúc response để lấy đúng ID
        console.log("Create response:", response.data);
        // Đảm bảo lấy giá trị số, tránh lấy nhầm object
        const parkId = typeof response.data.ma_cong_vien === 'number' ? response.data.ma_cong_vien : 
                       (typeof response.data.id === 'number' ? response.data.id : response.data.pk);

        // 2. Upload ảnh công viên (Giả lập upload từng ảnh)
        // Lưu ý: Cần API upload thực tế, ở đây dùng imagesAPI.create
        for (let i = 0; i < parkImages.length; i++) {
          const formData = new FormData();
          formData.append('ma_cong_vien', parkId);
          formData.append('url_anh', parkImages[i]); // Backend cần xử lý file upload
          formData.append('la_anh_chinh', i === 0); // Ảnh đầu tiên là ảnh chính
          try {
            await imagesAPI.create(formData);
          } catch (e) {
            console.error("Lỗi upload ảnh", e);
          }
        }

        // 3. Tạo tiện ích và upload ảnh tiện ích
        for (const key of Object.keys(amenities)) {
          if (amenities[key].checked) {
            const item = amenities[key];

            const amenityFormData = new FormData();
            amenityFormData.append('ma_cong_vien', parkId);
            amenityFormData.append('ma_loai_tien_ich', item.id_type); // Dùng ID đã lưu
            amenityFormData.append('so_luong', amenities[key].quantity || 1);
            amenityFormData.append('mo_ta', amenities[key].description || ''); // Gửi ghi chú
            amenityFormData.append('tinh_trang', 'tot');
            amenityFormData.append('dang_su_dung', true);
            
            // Gửi kèm file ảnh tiện ích (nếu có)
            amenities[key].images.forEach((file) => {
              amenityFormData.append('hinh_anh_files', file);
            });

            try {
              await amenitiesAPI.create(amenityFormData);
            } catch (e) {
              console.error(`Lỗi tạo tiện ích ${key}`, e);
            }
          }
        }

        showNotification('Tạo công viên thành công!', 'success');
        navigate(`/parks/${parkId}`);
      } catch (err) {
        console.error("Lỗi tạo công viên:", err.response?.data);
        
        // Xử lý hiển thị lỗi thân thiện hơn
        let errorMsg = 'Lỗi khi tạo công viên';
        if (err.response?.data) {
          // Nếu lỗi là trùng tên (từ validator backend)
          if (err.response.data.ten_cong_vien) {
            errorMsg = err.response.data.ten_cong_vien[0];
          } else {
            // Các lỗi khác
            errorMsg = Object.values(err.response.data).flat().join(', ');
          }
        }
        
        showNotification(
          errorMsg,
          'error'
        );
      }
    }
  );

  // Xử lý chọn ảnh công viên
  const handleParkImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setParkImages(prev => [...prev, ...filesArray]);
    }
  };

  // Xử lý xóa ảnh công viên đã chọn
  const handleRemoveParkImage = (index) => {
    setParkImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Xử lý checkbox tiện ích
  const handleAmenityCheck = (key) => {
    setAmenities(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }));
  };

  // Xử lý ảnh tiện ích
  const handleAmenityImageChange = (key, e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Giới hạn 2 ảnh
      const currentLength = amenities[key].images.length;
      const newFiles = filesArray.slice(0, 2 - currentLength);
      
      setAmenities(prev => ({
        ...prev,
        [key]: { ...prev[key], images: [...prev[key].images, ...newFiles] }
      }));
    }
  };

  // Xử lý xóa ảnh tiện ích đã chọn
  const handleRemoveAmenityImage = (key, index) => {
    setAmenities((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        images: prev[key].images.filter((_, i) => i !== index),
      },
    }));
  };

  // Xử lý ghi chú tiện ích
  const handleAmenityDescriptionChange = (key, value) => {
    setAmenities(prev => ({
      ...prev,
      [key]: { ...prev[key], description: value }
    }));
  };

  // Xử lý số lượng tiện ích
  const handleAmenityQuantityChange = (key, value) => {
    setAmenities(prev => ({
      ...prev,
      [key]: { ...prev[key], quantity: parseInt(value) || 1 }
    }));
  };

  return (
    <div className="park-form-page">
      <div className="form-header">
        <h1>Tạo Công Viên</h1>
        <p>Điền đầy đủ thông tin công viên</p>
      </div>

      <form onSubmit={handleSubmit} className="park-form">
        <div className="form-section">
          <h2>Thông Tin Cơ Bản</h2>

          <div className="form-group">
            <label htmlFor="tens">Tên Công Viên *</label>
            <input
              id="tens"
              name="tens"
              type="text"
              value={values.tens}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Vd: Công viên Tao Đàn"
              required
            />
            {touched.tens && errors.tens && <span className="error">{errors.tens}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="mo_ta">Mô Tả Chi Tiết (Tối thiểu 250 ký tự để tối ưu SEO) *</label>
            <textarea
              id="mo_ta"
              name="mo_ta"
              value={values.mo_ta}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Viết mô tả chi tiết, dài về công viên. Hãy kể về lịch sử, các tiện ích, cảnh quan, và lợi ích đó mang lại cho cộng đồng. Tối thiểu 250 ký tự để tối ưu hóa công cụ tìm kiếm..."
              rows={8}
              style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}
            />
            <div style={{fontSize: '12px', color: values.mo_ta?.length >= 250 ? '#4CAF50' : '#FF9800', marginTop: '5px'}}>
              {values.mo_ta ? `${values.mo_ta.length} ký tự` : '0 ký tự'} (Khuyến nghị: ≥250 ký tự)
            </div>
            {touched.mo_ta && errors.mo_ta && <span className="error">{errors.mo_ta}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dien_tich_m2">Diện Tích (m²) *</label>
              <input
                id="dien_tich_m2"
                name="dien_tich_m2"
                type="number"
                value={values.dien_tich_m2}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Vd: 100000"
                required
              />
              {touched.dien_tich_m2 && errors.dien_tich_m2 && (
                <span className="error">{errors.dien_tich_m2}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ma_quan_huyen">Quận Huyện *</label>
              <select
                id="ma_quan_huyen"
                name="ma_quan_huyen"
                value={values.ma_quan_huyen}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="">-- Chọn Quận/Huyện --</option>
                {districts.map((d) => (
                  <option key={d.ma_quan_huyen} value={d.ma_quan_huyen}>
                    {d.ten_quan_huyen}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ma_loai">Loại Công Viên *</label>
            <select
              id="ma_loai"
              name="ma_loai"
              value={values.ma_loai}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">-- Chọn Loại Công Viên --</option>
              {parkTypes.map((t) => (
                <option key={t.ma_loai} value={t.ma_loai}>
                  {t.ten_loai}
                </option>
              ))}
            </select>
          </div>

          {/* SEO Keywords Section */}
          <div className="form-group">
            <label htmlFor="seo_keywords">Từ khóa SEO (tùy chọn)</label>
            <textarea
              id="seo_keywords"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="Nhập các từ khóa liên quan được phân cách bằng dấu phẩy. VD: công viên Quận 1, công viên xanh tại TP.HCM, địa điểm vui chơi gia đình"
              rows={3}
              style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}
            />
            <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
              Giúp tối ưu hóa công cụ tìm kiếm (SEO)
            </small>
          </div>
        </div>

        <div className="form-section">
          <h2>Vị Trí (Tọa Độ)</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="toa_do_trung_tam_lat">Vĩ Độ (Latitude) *</label>
              <input
                id="toa_do_trung_tam_lat"
                name="toa_do_trung_tam_lat"
                type="number"
                step="0.0001"
                value={values.toa_do_trung_tam_lat}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="toa_do_trung_tam_lng">Kinh Độ (Longitude) *</label>
              <input
                id="toa_do_trung_tam_lng"
                name="toa_do_trung_tam_lng"
                type="number"
                step="0.0001"
                value={values.toa_do_trung_tam_lng}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>
          </div>
          
          <div style={{ height: '400px', width: '100%', marginTop: '15px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
            <MapContainer 
              center={[parseFloat(values.toa_do_trung_tam_lat) || 10.8231, parseFloat(values.toa_do_trung_tam_lng) || 106.6797]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <LocationMarker setFieldValue={setFieldValue} />
              <RecenterMap lat={parseFloat(values.toa_do_trung_tam_lat) || 10.8231} lng={parseFloat(values.toa_do_trung_tam_lng) || 106.6797} />
              <Marker position={[parseFloat(values.toa_do_trung_tam_lat) || 10.8231, parseFloat(values.toa_do_trung_tam_lng) || 106.6797]} />
            </MapContainer>
          </div>
          <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
            Click trực tiếp trên bản đồ để ghim vị trí chính xác
          </small>
        </div>

        {/* Phần Hình Ảnh Công Viên */}
        <div className="form-section">
          <h2>Hình Ảnh Công Viên (Tối thiểu 4 ảnh chất lượng cao)</h2>
          <small style={{color: '#666', display: 'block', marginBottom: '10px'}}>
            Tải lên các hình ảnh chất lượng cao, đa dạng (toàn cảnh, tiện ích, cây cỏ, v.v.) để tối ưu hóa SEO và thu hút du khách
          </small>
          <div className="form-group">
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleParkImageChange}
              className="file-input"
            />
            <div className="image-preview-list" style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px'}}>
              {parkImages.map((img, idx) => (
                <div key={idx} className="image-preview" style={{width: '100px', height: '100px', border: '1px solid #ddd', position: 'relative'}}>
                  <img src={URL.createObjectURL(img)} alt={`Preview ${idx}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  <button
                    type="button"
                    onClick={() => handleRemoveParkImage(idx)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >×</button>
                </div>
              ))}
            </div>
            {parkImages.length < 4 && <span className="error">⚠ Hiện tại: {parkImages.length} ảnh. Cần thêm ít nhất {4 - parkImages.length} ảnh nữa.</span>}
            {parkImages.length >= 4 && <span style={{color: '#4CAF50', fontSize: '12px'}}>Đạt yêu cầu tối thiểu</span>}
          </div>
        </div>

        {/* Phần Tiện Ích */}
        <div className="form-section">
          <h2>Tiện Ích Có Sẵn</h2>
          <div className="amenities-list">
            {Object.keys(amenities).map(key => (
              <div key={key} className="amenity-item" style={{marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px'}}>
                <div className="checkbox-group" style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                  <input 
                    type="checkbox" 
                    id={`amenity-${key}`} 
                    checked={amenities[key].checked}
                    onChange={() => handleAmenityCheck(key)}
                    style={{width: '20px', height: '20px', marginRight: '10px'}}
                  />
                  <label htmlFor={`amenity-${key}`} style={{fontSize: '16px', fontWeight: 'bold'}}>{amenities[key].label}</label>
                </div>

                {amenities[key].checked && (
                  <div className="amenity-upload" style={{marginLeft: '30px'}}>
                    <div style={{marginBottom: '10px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Số lượng:</label>
                      <input 
                        type="number" 
                        min="1"
                        value={amenities[key].quantity}
                        onChange={(e) => handleAmenityQuantityChange(key, e.target.value)}
                        style={{width: '100px', padding: '5px'}}
                      />
                    </div>

                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Tải lên 2 ảnh minh họa:</label>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => handleAmenityImageChange(key, e)}
                      disabled={amenities[key].images.length >= 2}
                    />
                    
                    {/* Preview ảnh tiện ích */}
                    <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                      {amenities[key].images.map((img, idx) => (
                        <div key={idx} style={{width: '80px', height: '80px', border: '1px solid #ddd', position: 'relative'}}>
                          <img src={URL.createObjectURL(img)} alt={`Amenity ${idx}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenityImage(key, idx)}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px', height: '20px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>

                    <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>Đã chọn: {amenities[key].images.length}/2 ảnh</div>
                    
                    <label style={{display: 'block', marginTop: '15px', marginBottom: '5px', fontWeight: 'bold'}}>
                      Mô tả chi tiết (Tối thiểu 150 ký tự để tối ưu SEO) *
                    </label>
                    <textarea
                      placeholder={`Mô tả chi tiết ${amenities[key].label}. Giới thiệu các tiện ích, điều kiện vệ sinh, giờ mở cửa, chi phí sử dụng... Ví dụ: "${amenities[key].label} của công viên này được xây dựng với tiêu chuẩn quốc tế, luôn sạch sẽ và được bảo trì thường xuyên. Phù hợp cho tất cả lứa tuổi..."`}
                      value={amenities[key].description}
                      onChange={(e) => handleAmenityDescriptionChange(key, e.target.value)}
                      rows={4}
                      style={{width: '100%', marginTop: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                    />
                    <div style={{fontSize: '12px', color: amenities[key].description?.length >= 150 ? '#4CAF50' : '#FF9800', marginTop: '5px'}}>
                      {amenities[key].description ? `${amenities[key].description.length} ký tự` : '0 ký tự'} (Khuyến nghị: ≥150 ký tự)
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Tạo Công Viên'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/parks-list')}
            className="btn btn-ghost btn-large"
          >
            Hủy
          </button>
        </div>
      </form>

    </div>
  );
}
