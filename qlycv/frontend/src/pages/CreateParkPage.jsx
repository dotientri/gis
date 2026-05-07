import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../hooks';
import { parksAPI, imagesAPI, amenitiesAPI, parkTypesAPI, districtsAPI, treesAPI } from '../api';
import { useUIStore } from '../store';
import { MAP_CONFIG } from '../constants';
import RichTextEditor from '../components/Form/RichTextEditor';
import ParkLocationPicker from '../components/Form/ParkLocationPicker';
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

// Định nghĩa trực tiếp API status để tránh lỗi build khi file api.js chưa export
const parkStatusesAPI = {
  getList: async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/trang-thai-cong-vien/`);
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: [] };
    }
  }
};

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
  const [parkStatuses, setParkStatuses] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState([]); // Thêm state lưu loại tiện ích
  const [treeTypes, setTreeTypes] = useState([]); // State cho loại cây
  const [seoKeywords, setSeoKeywords] = useState(''); // State cho SEO keywords
  
  // State cho hình ảnh, tiện ích và cây
  const [parkImages, setParkImages] = useState([]);
  // Khởi tạo state rỗng, sẽ được điền dữ liệu từ API
  const [amenities, setAmenities] = useState({});
  const [trees, setTrees] = useState([]); // State cho danh sách cây

  // Tải danh sách Loại công viên và Quận huyện
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, districtsRes, amenitiesRes, statusesRes, treesRes] = await Promise.all([
          parkTypesAPI.getList(),
          districtsAPI.getList({ limit: 100 }),
          amenitiesAPI.getTypes(), // Tải danh sách loại tiện ích
          parkStatusesAPI.getList(), // Tải danh sách trạng thái
          treesAPI.getTypes() // Tải danh sách loại cây
        ]);
        setParkTypes(typesRes.data.results || typesRes.data);
        setDistricts(districtsRes.data.results || districtsRes.data);
        setParkStatuses(statusesRes.data.results || statusesRes.data);
        setTreeTypes(treesRes.data.results || treesRes.data);
        
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
      lich_su: '',
      dien_tich_m2: '',
      ma_loai: '',
      ma_trang_thai: '',
      ma_quan_huyen: '',
      dia_chi: '',
      gio_mo_cua: '',
      gio_dong_cua: '',
      mo_cua_24_7: false,
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
          lich_su: values.lich_su,
          dien_tich_m2: parseFloat(values.dien_tich_m2),
          ma_trang_thai: values.ma_trang_thai,
          ma_loai: values.ma_loai,
          ma_quan_huyen: values.ma_quan_huyen,
          dia_chi: values.dia_chi,
          mo_cua_24_7: Boolean(values.mo_cua_24_7),
          gio_mo_cua: values.mo_cua_24_7 ? null : (values.gio_mo_cua || null),
          gio_dong_cua: values.mo_cua_24_7 ? null : (values.gio_dong_cua || null),
          toa_do_trung_tam: [
            parseFloat(values.toa_do_trung_tam_lat),
            parseFloat(values.toa_do_trung_tam_lng),
          ],
          tu_khoa_seo: seoKeywords,
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

        // 4. Tạo danh sách cây (nếu có)
        for (const tree of trees) {
          if (tree.ma_loai_cay) { // Chỉ create cây nếu có loại cây được chá»n
            const treeData = {
              ma_cong_vien: parkId,
              ma_loai_cay: tree.ma_loai_cay,
              ma_so_cay: tree.ma_so_cay || null,
              chieu_cao_m: tree.chieu_cao_m ? parseFloat(tree.chieu_cao_m) : null,
              duong_kinh_cm: tree.duong_kinh_cm ? parseFloat(tree.duong_kinh_cm) : null,
              ban_kinh_tan_m: tree.ban_kinh_tan_m ? parseFloat(tree.ban_kinh_tan_m) : null,
              tinh_trang: tree.tinh_trang || 'tot',
              ngay_trong: tree.ngay_trong || null,
              ngay_cat_tia_cuoi: tree.ngay_cat_tia_cuoi || null,
            };

            try {
              await treesAPI.create(treeData);
            } catch (e) {
              console.error("Lỗi tạo cây:", e);
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

  // Xử lý chá»n ảnh công viên
  const handleLocationPick = (nextLat, nextLng) => {
    setFieldValue('toa_do_trung_tam_lat', Number(nextLat).toFixed(6));
    setFieldValue('toa_do_trung_tam_lng', Number(nextLng).toFixed(6));
  };

  const handleParkImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setParkImages(prev => [...prev, ...filesArray]);
    }
  };

  // Xử lý xóa ảnh công viên đã chá»n
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

  // Xử lý xóa ảnh tiện ích đã chá»n
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

  // Xử lý thêm cây
  const handleAddTree = () => {
    setTrees(prev => [...prev, {
      ma_loai_cay: '',
      ma_so_cay: '',
      chieu_cao_m: '',
      duong_kinh_cm: '',
      ban_kinh_tan_m: '',
      tinh_trang: 'tot',
      ngay_trong: '',
      ngay_cat_tia_cuoi: ''
    }]);
  };

  // Xử lý thay đổi cây
  const handleTreeChange = (index, field, value) => {
    setTrees(prev => {
      const newTrees = [...prev];
      newTrees[index] = { ...newTrees[index], [field]: value };
      return newTrees;
    });
  };

  // Xử lý xóa cây
  const handleRemoveTree = (index) => {
    setTrees(prev => prev.filter((_, i) => i !== index));
  };

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
            <RichTextEditor
              name="mo_ta"
              label="Mô Tả Chi Tiết (Tối thiểu 250 ký tự) *"
              value={values.mo_ta}
              onChange={(nextValue) => setFieldValue('mo_ta', nextValue)}
              onBlur={handleBlur}
              placeholder="Viết mô tả chi tiết, dài về công viên. Hãy kể về lịch sử, các tiện ích, cảnh quan, và lợi ích đó mang lại cho cộng đồng. Tối thiểu 250 ký tự..."
              helperText="Nội dung này sẽ hiển thị ở trang bài viết và chi tiết công viên."
              minLength={250}
              error={touched.mo_ta && errors.mo_ta ? errors.mo_ta : ''}
            />
          </div>

          <div className="form-group">
            <RichTextEditor
              name="lich_su"
              label="Lịch Sử Và Bối Cảnh (Tùy chá»n)"
              value={values.lich_su}
              onChange={(nextValue) => setFieldValue('lich_su', nextValue)}
              onBlur={handleBlur}
              placeholder="Bổ sung lịch sử hình thành, các dấu mốc phát triển và bối cảnh của công viên."
              helperText="Phần này sẽ hiển thị ở mục lịch sử trong bài viết công viên."
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
            <label htmlFor="ma_trang_thai">Trạng Thái *</label>
            <select
              id="ma_trang_thai"
              name="ma_trang_thai"
              value={values.ma_trang_thai}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">-- Chọn Trạng Thái --</option>
              {parkStatuses.map((s) => (
                <option key={s.ma_trang_thai} value={s.ma_trang_thai}>
                  {s.mo_ta || s.ten_trang_thai}
                </option>
              ))}
            </select>
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

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                name="mo_cua_24_7"
                type="checkbox"
                checked={Boolean(values.mo_cua_24_7)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setFieldValue('mo_cua_24_7', checked);
                  if (checked) {
                    setFieldValue('gio_mo_cua', '');
                    setFieldValue('gio_dong_cua', '');
                  }
                }}
              />
              <span>Mo cua 24/7</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gio_mo_cua">Gio mo cua</label>
              <input
                id="gio_mo_cua"
                name="gio_mo_cua"
                type="time"
                value={values.gio_mo_cua}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={Boolean(values.mo_cua_24_7)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gio_dong_cua">Gio dong cua</label>
              <input
                id="gio_dong_cua"
                name="gio_dong_cua"
                type="time"
                value={values.gio_dong_cua}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={Boolean(values.mo_cua_24_7)}
              />
            </div>
          </div>

          {/* SEO Keywords Section */}
          <div className="form-group">
            <label htmlFor="seo_keywords">Từ khóa tìm kiếm (tùy chá»n)</label>
            <textarea
              id="seo_keywords"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="Nhập các từ khóa liên quan được phân cách bằng dấu phẩy. VD: công viên Quận 1, công viên xanh tại TP.HCM, địa điểm vui chơi gia đình"
              rows={3}
              style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}
            />
            <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
              Giúp tối ưu hóa công cụ tìm kiếm
            </small>
          </div>
        </div>

        <div className="form-section">
          <h2>Vị Trí (Tá»a Độ)</h2>

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
          
          <ParkLocationPicker
            lat={values.toa_do_trung_tam_lat}
            lng={values.toa_do_trung_tam_lng}
            address={values.dia_chi}
            onPick={handleLocationPick}
            onAddressChange={(nextAddress) => setFieldValue('dia_chi', nextAddress)}
          />

          <div className="form-group">
            <label htmlFor="dia_chi">Địa Chỉ Chi Tiết *</label>
            <textarea
              id="dia_chi"
              name="dia_chi"
              value={values.dia_chi}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Vd: Tố Hữu, Quận 4, TP. Hồ Chí Minh"
              rows={2}
              style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}
              required
            />
            {touched.dia_chi && errors.dia_chi && <span className="error">{errors.dia_chi}</span>}
          </div>
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
            {parkImages.length < 4 && <span className="error">â  Hiện tại: {parkImages.length} ảnh. Cần thêm ít nhất {4 - parkImages.length} ảnh nữa.</span>}
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

                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Tải lên 2 ảnh minh há»a:</label>
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

                    <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>Đã chá»n: {amenities[key].images.length}/2 ảnh</div>
                    
                    <label style={{display: 'block', marginTop: '15px', marginBottom: '5px', fontWeight: 'bold'}}>
                      Mô tả chi tiết (Tối thiểu 150 ký tự) *
                    </label>
                    <textarea
                      placeholder={`Mô tả chi tiết ${amenities[key].label}. Giới thiệu các tiện ích, điều kiện vệ sinh, giờ mở cửa, chi phí sử dụng...`}
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

        {/* Phần Cây Xanh */}
        <div className="form-section">
          <h2>Cây Xanh (Tùy Chọn)</h2>
          <small style={{color: '#666', display: 'block', marginBottom: '10px'}}>
            Nhập thông tin chi tiết về các cây trong công viên
          </small>

          {trees.map((tree, idx) => (
            <div key={idx} style={{marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{margin: 0}}>Cây thứ {idx + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveTree(idx)}
                  style={{background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Xóa cây này
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại Cây *</label>
                  <select
                    value={tree.ma_loai_cay}
                    onChange={(e) => handleTreeChange(idx, 'ma_loai_cay', e.target.value)}
                    required
                  >
                    <option value="">-- Chọn Loại Cây --</option>
                    {treeTypes.map((t) => (
                      <option key={t.ma_loai_cay} value={t.ma_loai_cay}>
                        {t.ten_loai}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`ma_so_cay_${idx}`}>Mã Số Cây</label>
                  <input
                    id={`ma_so_cay_${idx}`}
                    type="text"
                    value={tree.ma_so_cay}
                    onChange={(e) => handleTreeChange(idx, 'ma_so_cay', e.target.value)}
                    placeholder="VD: C001, C002"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`chieu_cao_${idx}`}>Chiá»u Cao (mét)</label>
                  <input
                    id={`chieu_cao_${idx}`}
                    type="number"
                    step="0.1"
                    value={tree.chieu_cao_m}
                    onChange={(e) => handleTreeChange(idx, 'chieu_cao_m', e.target.value)}
                    placeholder="VD: 5.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`duong_kinh_${idx}`}>Đường Kính (cm)</label>
                  <input
                    id={`duong_kinh_${idx}`}
                    type="number"
                    step="0.1"
                    value={tree.duong_kinh_cm}
                    onChange={(e) => handleTreeChange(idx, 'duong_kinh_cm', e.target.value)}
                    placeholder="VD: 30.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`ban_kinh_${idx}`}>Bán Kính Tán (mét)</label>
                  <input
                    id={`ban_kinh_${idx}`}
                    type="number"
                    step="0.1"
                    value={tree.ban_kinh_tan_m}
                    onChange={(e) => handleTreeChange(idx, 'ban_kinh_tan_m', e.target.value)}
                    placeholder="VD: 4.2"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`tinh_trang_${idx}`}>Tình Trạng</label>
                  <select
                    id={`tinh_trang_${idx}`}
                    value={tree.tinh_trang}
                    onChange={(e) => handleTreeChange(idx, 'tinh_trang', e.target.value)}
                  >
                    <option value="tot">Tốt</option>
                    <option value="kha">Khá</option>
                    <option value="trung_binh">Trung Bình</option>
                    <option value="kem">Kém</option>
                    <option value="chet">Chết</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`ngay_trong_${idx}`}>Ngày Trồng</label>
                  <input
                    id={`ngay_trong_${idx}`}
                    type="date"
                    value={tree.ngay_trong}
                    onChange={(e) => handleTreeChange(idx, 'ngay_trong', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`ngay_cat_tia_${idx}`}>Ngày Cắt Tỉa Cuối</label>
                  <input
                    id={`ngay_cat_tia_${idx}`}
                    type="date"
                    value={tree.ngay_cat_tia_cuoi}
                    onChange={(e) => handleTreeChange(idx, 'ngay_cat_tia_cuoi', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddTree}
            style={{background: '#4CAF50', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px'}}
          >
            + Thêm Cây
          </button>
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
