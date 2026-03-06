import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '../hooks';
import { parksAPI, districtsAPI, parkTypesAPI, amenitiesAPI, imagesAPI } from '../api';
import { useUIStore } from '../store';
import '../styles/pages/ParkFormPage.css';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix lỗi icon mặc định của Leaflet
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
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function EditParkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [park, setPark] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [parkTypes, setParkTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amenityTypes, setAmenityTypes] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  
  // State động
  const [amenities, setAmenities] = useState({});

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } = useForm(
    {
      tens: '',
      mo_ta: '',
      dien_tich_m2: '',
      ma_loai: '',
      ma_quan_huyen: '',
      toa_do_trung_tam_lat: '',
      toa_do_trung_tam_lng: '',
    },
    async (values) => {
      try {
        const parkData = {
          ten_cong_vien: values.tens, // Sửa tên trường cho khớp backend
          mo_ta: values.mo_ta,
          dien_tich_m2: parseFloat(values.dien_tich_m2),
          ma_loai: values.ma_loai,
          ma_quan_huyen: values.ma_quan_huyen,
          toa_do_trung_tam: [
            parseFloat(values.toa_do_trung_tam_lat),
            parseFloat(values.toa_do_trung_tam_lng),
          ],
        };

        const response = await parksAPI.update(id, parkData);

        // Upload ảnh mới (nếu có)
        if (newImages.length > 0) {
          for (const file of newImages) {
            const formData = new FormData();
            formData.append('ma_cong_vien', id);
            formData.append('url_anh', file);
            try {
              await imagesAPI.create(formData);
            } catch (e) { console.error("Lỗi upload ảnh", e); }
          }
        }

        // Cập nhật tiện ích
        for (const key of Object.keys(amenities)) {
          const item = amenities[key];
          
          if (item.checked) {
            const amenityData = new FormData();
            amenityData.append('ma_cong_vien', id);
            amenityData.append('ma_loai_tien_ich', item.id_type);
            amenityData.append('so_luong', item.quantity || 1);
            amenityData.append('mo_ta', item.description || '');
            amenityData.append('tinh_trang', 'tot');
            amenityData.append('dang_su_dung', true);

            // Gửi kèm file ảnh tiện ích mới (nếu có)
            if (item.newImages && item.newImages.length > 0) {
              item.newImages.forEach((file) => {
                amenityData.append('hinh_anh_files', file);
              });
            }

            if (item.id) {
              // Update existing
              await amenitiesAPI.update(item.id, amenityData);
            } else {
              // Create new
              await amenitiesAPI.create(amenityData);
            }
          } else if (!item.checked && item.id) {
            // Delete if unchecked but exists
            try {
              await amenitiesAPI.delete(item.id);
            } catch (e) { console.error(e); }
          }
        }

        showNotification('Cập nhật công viên thành công!', 'success');
        navigate(`/parks/${id}`);
      } catch (err) {
        let errorMsg = 'Lỗi khi cập nhật công viên';
        if (err.response?.data) {
          if (err.response.data.ten_cong_vien) {
            errorMsg = err.response.data.ten_cong_vien[0];
          } else {
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

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công viên này? Hành động này không thể hoàn tác.')) {
      try {
        await parksAPI.delete(id);
        showNotification('Xóa công viên thành công!', 'success');
        navigate('/parks-list');
      } catch (err) {
        showNotification(
          err.response?.data?.detail || 'Lỗi khi xóa công viên',
          'error'
        );
      }
    }
  };

  useEffect(() => {
    const fetchPark = async () => {
      try {
        // Tải dữ liệu công viên VÀ danh mục cùng lúc
        const [response, districtsRes, typesRes, amenitiesRes, parkAmenitiesRes] = await Promise.all([
          parksAPI.getDetail(id),
          districtsAPI.getList({ limit: 100 }),
          parkTypesAPI.getList(),
          amenitiesAPI.getTypes(),
          amenitiesAPI.getList({ ma_cong_vien: id })
        ]);

        setPark(response.data);
        setDistricts(districtsRes.data.results || districtsRes.data);
        setParkTypes(typesRes.data.results || typesRes.data);
        setExistingImages(response.data.hinh_anh || []);
        
        // Pre-fill form
        setFieldValue('tens', response.data.ten_cong_vien || response.data.tens);
        setFieldValue('mo_ta', response.data.mo_ta || '');
        setFieldValue('dien_tich_m2', response.data.dien_tich_m2);
        
        // FIX: Lấy ID nếu API trả về object, hoặc lấy giá trị trực tiếp nếu là ID
        const maLoai = response.data.ma_loai && typeof response.data.ma_loai === 'object' 
          ? response.data.ma_loai.ma_loai 
          : response.data.ma_loai;
        setFieldValue('ma_loai', maLoai || '');

        const maQuanHuyen = response.data.ma_quan_huyen && typeof response.data.ma_quan_huyen === 'object' 
          ? response.data.ma_quan_huyen.ma_quan_huyen 
          : response.data.ma_quan_huyen;
        setFieldValue('ma_quan_huyen', maQuanHuyen || '');
        
        if (response.data.toa_do_trung_tam) {
          setFieldValue('toa_do_trung_tam_lat', response.data.toa_do_trung_tam[0]);
          setFieldValue('toa_do_trung_tam_lng', response.data.toa_do_trung_tam[1]);
        }

        // Map tiện ích hiện có vào state
        const existingAmenities = parkAmenitiesRes.data.results || parkAmenitiesRes.data;
        const types = amenitiesRes.data.results || amenitiesRes.data;
        
        setAmenityTypes(types);

        // Khởi tạo state động dựa trên danh sách loại tiện ích
        const newAmenitiesState = {};
        types.forEach(type => {
          newAmenitiesState[type.ma_code] = {
            checked: false, newImages: [], existingImages: [], 
            label: type.ten_loai, code: type.ma_code, id_type: type.ma_loai_tien_ich,
            description: '', quantity: 1, id: null 
          };
        });

        // Điền dữ liệu cũ vào
        existingAmenities.forEach(am => {
          // Tìm key tương ứng dựa trên ma_loai_tien_ich
          const typeCode = types.find(t => t.ma_loai_tien_ich === am.ma_loai_tien_ich)?.ma_code;
          
          if (typeCode && newAmenitiesState[typeCode]) {
            newAmenitiesState[typeCode] = {
              ...newAmenitiesState[typeCode],
              checked: true,
              id: am.ma_tien_ich || am.id,
              quantity: am.so_luong || 1,
              description: am.mo_ta || '',
              existingImages: am.hinh_anh || [],
              newImages: []
            };
          }
        });
        setAmenities(newAmenitiesState);

      } catch (err) {
        showNotification('Không thể tải thông tin công viên', 'error');
        navigate('/parks-list');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPark();
    }
  }, [id]);

  // Handlers cho tiện ích
  const handleAmenityCheck = (key) => {
    setAmenities(prev => ({ ...prev, [key]: { ...prev[key], checked: !prev[key].checked } }));
  };

  const handleAmenityQuantityChange = (key, value) => {
    setAmenities(prev => ({ ...prev, [key]: { ...prev[key], quantity: parseInt(value) || 1 } }));
  };

  const handleAmenityDescriptionChange = (key, value) => {
    setAmenities(prev => ({ ...prev, [key]: { ...prev[key], description: value } }));
  };

  // Handlers cho ảnh tiện ích
  const handleAmenityImageChange = (key, e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAmenities(prev => ({
        ...prev,
        [key]: { ...prev[key], newImages: [...(prev[key].newImages || []), ...filesArray] }
      }));
    }
  };

  const handleRemoveAmenityNewImage = (key, index) => {
    setAmenities(prev => ({
      ...prev,
      [key]: { ...prev[key], newImages: prev[key].newImages.filter((_, i) => i !== index) }
    }));
  };

  // Handlers cho hình ảnh
  const handleNewImageChange = (e) => {
    if (e.target.files) {
      setNewImages(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
      try {
        await imagesAPI.delete(imageId);
        setExistingImages(prev => prev.filter(img => img.ma_hinh_anh !== imageId));
        showNotification('Đã xóa ảnh', 'success');
      } catch (e) {
        showNotification('Lỗi khi xóa ảnh', 'error');
      }
    }
  };

  if (loading) {
    return <div className="spinner">Đang tải...</div>;
  }

  return (
    <div className="park-form-page">
      <div className="form-header">
        <h1>Chỉnh Sửa</h1>
        <p>{park?.tens}</p>
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
            <label htmlFor="mo_ta">Mô Tả</label>
            <textarea
              id="mo_ta"
              name="mo_ta"
              value={values.mo_ta}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Mô tả chi tiết về công viên"
              rows={4}
            />
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
              <RecenterMap lat={parseFloat(values.toa_do_trung_tam_lat)} lng={parseFloat(values.toa_do_trung_tam_lng)} />
              <Marker position={[parseFloat(values.toa_do_trung_tam_lat) || 10.8231, parseFloat(values.toa_do_trung_tam_lng) || 106.6797]} />
            </MapContainer>
          </div>
          <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
            Click trực tiếp trên bản đồ để ghim vị trí chính xác
          </small>
        </div>

        {/* Phần Hình Ảnh Công Viên */}
        <div className="form-section">
          <h2>Hình Ảnh Công Viên</h2>
          
          {/* Ảnh hiện có */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Ảnh hiện có:</label>
              <div className="image-preview-list" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {existingImages.map((img) => (
                  <div key={img.ma_hinh_anh} className="image-preview" style={{ width: '120px', height: '120px', border: '1px solid #ddd', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={img.url_anh} alt="Park" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(img.ma_hinh_anh)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%',
                        width: '24px', height: '24px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      title="Xóa ảnh"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thêm ảnh mới */}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Thêm ảnh mới:</label>
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleNewImageChange}
              className="file-input"
            />
            {newImages.length > 0 && (
              <div className="image-preview-list" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {newImages.map((file, idx) => (
                  <div key={idx} className="image-preview" style={{ width: '100px', height: '100px', border: '1px solid #ddd', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%',
                        width: '20px', height: '20px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phần Tiện Ích */}
        <div className="form-section">
          <h2>Tiện Ích</h2>
          <div className="amenities-list">
            {Object.keys(amenities).map(key => (
              <div key={key} className="amenity-item" style={{marginBottom: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '8px'}}>
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
                  <div className="amenity-details" style={{marginLeft: '30px'}}>
                    <div style={{marginBottom: '10px'}}>
                      <label style={{fontWeight: 'bold', marginRight: '10px'}}>Số lượng:</label>
                      <input 
                        type="number" 
                        min="1"
                        value={amenities[key].quantity}
                        onChange={(e) => handleAmenityQuantityChange(key, e.target.value)}
                        style={{width: '80px', padding: '5px'}}
                      />
                    </div>

                    {/* Quản lý ảnh tiện ích */}
                    <div style={{marginBottom: '10px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Hình ảnh:</label>
                      
                      {/* Ảnh cũ */}
                      {amenities[key].existingImages && amenities[key].existingImages.length > 0 && (
                        <div style={{display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap'}}>
                          {amenities[key].existingImages.map((url, idx) => (
                            <div key={`exist-${idx}`} style={{width: '60px', height: '60px', border: '1px solid #ddd'}}>
                              <img src={url} alt="Amenity" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload ảnh mới */}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => handleAmenityImageChange(key, e)}
                      />
                      
                      {/* Preview ảnh mới */}
                      {amenities[key].newImages && amenities[key].newImages.length > 0 && (
                        <div style={{display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap'}}>
                          {amenities[key].newImages.map((file, idx) => (
                            <div key={`new-${idx}`} style={{width: '60px', height: '60px', border: '1px solid #ddd', position: 'relative'}}>
                              <img src={URL.createObjectURL(file)} alt="New" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                              <button type="button" onClick={() => handleRemoveAmenityNewImage(key, idx)} style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', width: '20px', height: '20px', cursor: 'pointer'}}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea
                      placeholder="Mô tả chi tiết tiện ích..."
                      value={amenities[key].description}
                      onChange={(e) => handleAmenityDescriptionChange(key, e.target.value)}
                      rows={2}
                      style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-large"
            style={{ marginRight: 'auto', backgroundColor: '#ef4444', color: 'white', border: 'none' }}
          >
            Xóa Công Viên
          </button>
          <button
            type="button"
            onClick={() => navigate(`/parks/${id}`)}
            className="btn btn-ghost btn-large"
          >
            Hủy
          </button>
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Cập Nhật'}
          </button>
        </div>
      </form>
    </div>
  );
}
