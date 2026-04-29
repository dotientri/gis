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

// Fix lá»—i icon máº·c Ä‘á»‹nh cá»§a Leaflet trong React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component xá»­ lĂ½ sá»± kiá»‡n click trĂªn báº£n Ä‘á»“
function LocationMarker({ setFieldValue }) {
  useMapEvents({
    click(e) {
      setFieldValue('toa_do_trung_tam_lat', e.latlng.lat.toFixed(6));
      setFieldValue('toa_do_trung_tam_lng', e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

// Component Ä‘á»ƒ cáº­p nháº­t view báº£n Ä‘á»“ khi tá»a Ä‘á»™ thay Ä‘á»•i tá»« input
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// FIX: Äá»‹nh nghÄ©a táº¡m API status táº¡i Ä‘Ă¢y Ä‘á»ƒ trĂ¡nh lá»—i thiáº¿u export trong api.js
const parkStatusesAPI = {
  getList: async () => {
    // Giáº£ Ä‘á»‹nh endpoint backend lĂ  /api/trang-thai-cong-vien/
    const response = await fetch('/api/trang-thai-cong-vien/');
    const data = await response.json();
    return { data };
  }
};

export default function CreateParkPage() {
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [parkTypes, setParkTypes] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [parkStatuses, setParkStatuses] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState([]); // ThĂªm state lÆ°u loáº¡i tiá»‡n Ă­ch
  const [treeTypes, setTreeTypes] = useState([]); // State cho loáº¡i cĂ¢y
  const [seoKeywords, setSeoKeywords] = useState(''); // State cho SEO keywords
  
  // State cho hĂ¬nh áº£nh, tiá»‡n Ă­ch vĂ  cĂ¢y
  const [parkImages, setParkImages] = useState([]);
  // Khá»Ÿi táº¡o state rá»—ng, sáº½ Ä‘Æ°á»£c Ä‘iá»n dá»¯ liá»‡u tá»« API
  const [amenities, setAmenities] = useState({});
  const [trees, setTrees] = useState([]); // State cho danh sĂ¡ch cĂ¢y

  // Táº£i danh sĂ¡ch Loáº¡i cĂ´ng viĂªn vĂ  Quáº­n huyá»‡n
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, districtsRes, amenitiesRes, statusesRes, treesRes] = await Promise.all([
          parkTypesAPI.getList(),
          districtsAPI.getList({ limit: 100 }),
          amenitiesAPI.getTypes(), // Táº£i danh sĂ¡ch loáº¡i tiá»‡n Ă­ch
          parkStatusesAPI.getList(), // Táº£i danh sĂ¡ch tráº¡ng thĂ¡i
          treesAPI.getTypes() // Táº£i danh sĂ¡ch loáº¡i cĂ¢y
        ]);
        setParkTypes(typesRes.data.results || typesRes.data);
        setDistricts(districtsRes.data.results || districtsRes.data);
        setParkStatuses(statusesRes.data.results || statusesRes.data);
        setTreeTypes(treesRes.data.results || treesRes.data);
        
        // Xá»­ lĂ½ danh sĂ¡ch tiá»‡n Ă­ch Ä‘á»™ng
        const typesList = amenitiesRes.data.results || amenitiesRes.data;
        setAmenityTypes(typesList);
        
        const initialAmenities = {};
        typesList.forEach(type => {
          // Sá»­ dá»¥ng ma_code lĂ m key
          initialAmenities[type.ma_code] = { 
            checked: false, images: [], label: type.ten_loai, code: type.ma_code, 
            id_type: type.ma_loai_tien_ich, description: '', quantity: 1 
          };
        });
        setAmenities(initialAmenities);
      } catch (error) {
        console.error("Lá»—i táº£i danh má»¥c:", error);
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
        // Validate: Ăt nháº¥t 4 áº£nh cĂ´ng viĂªn
        if (parkImages.length < 4) {
          showNotification('Vui lĂ²ng táº£i lĂªn Ă­t nháº¥t 4 áº£nh cho cĂ´ng viĂªn', 'error');
          return;
        }

        // Convert to backend format
        const parkData = {
          ten_cong_vien: values.tens, // Map Ä‘Ăºng tĂªn trÆ°á»ng backend yĂªu cáº§u
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
        };

        // 1. Táº¡o cĂ´ng viĂªn
        const response = await parksAPI.create(parkData);
        // Kiá»ƒm tra ká»¹ cáº¥u trĂºc response Ä‘á»ƒ láº¥y Ä‘Ăºng ID
        console.log("Create response:", response.data);
        // Äáº£m báº£o láº¥y giĂ¡ trá»‹ sá»‘, trĂ¡nh láº¥y nháº§m object
        const parkId = typeof response.data.ma_cong_vien === 'number' ? response.data.ma_cong_vien : 
                       (typeof response.data.id === 'number' ? response.data.id : response.data.pk);

        // 2. Upload áº£nh cĂ´ng viĂªn (Giáº£ láº­p upload tá»«ng áº£nh)
        // LÆ°u Ă½: Cáº§n API upload thá»±c táº¿, á»Ÿ Ä‘Ă¢y dĂ¹ng imagesAPI.create
        for (let i = 0; i < parkImages.length; i++) {
          const formData = new FormData();
          formData.append('ma_cong_vien', parkId);
          formData.append('url_anh', parkImages[i]); // Backend cáº§n xá»­ lĂ½ file upload
          formData.append('la_anh_chinh', i === 0); // áº¢nh Ä‘áº§u tiĂªn lĂ  áº£nh chĂ­nh
          try {
            await imagesAPI.create(formData);
          } catch (e) {
            console.error("Lá»—i upload áº£nh", e);
          }
        }

        // 3. Táº¡o tiá»‡n Ă­ch vĂ  upload áº£nh tiá»‡n Ă­ch
        for (const key of Object.keys(amenities)) {
          if (amenities[key].checked) {
            const item = amenities[key];

            const amenityFormData = new FormData();
            amenityFormData.append('ma_cong_vien', parkId);
            amenityFormData.append('ma_loai_tien_ich', item.id_type); // DĂ¹ng ID Ä‘Ă£ lÆ°u
            amenityFormData.append('so_luong', amenities[key].quantity || 1);
            amenityFormData.append('mo_ta', amenities[key].description || ''); // Gá»­i ghi chĂº
            amenityFormData.append('tinh_trang', 'tot');
            amenityFormData.append('dang_su_dung', true);
            
            // Gá»­i kĂ¨m file áº£nh tiá»‡n Ă­ch (náº¿u cĂ³)
            amenities[key].images.forEach((file) => {
              amenityFormData.append('hinh_anh_files', file);
            });

            try {
              await amenitiesAPI.create(amenityFormData);
            } catch (e) {
              console.error(`Lá»—i táº¡o tiá»‡n Ă­ch ${key}`, e);
            }
          }
        }

        // 4. Táº¡o danh sĂ¡ch cĂ¢y (náº¿u cĂ³)
        for (const tree of trees) {
          if (tree.ma_loai_cay) { // Chá»‰ create cĂ¢y náº¿u cĂ³ loáº¡i cĂ¢y Ä‘Æ°á»£c chá»n
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
              console.error("Lá»—i táº¡o cĂ¢y:", e);
            }
          }
        }

        showNotification('Táº¡o cĂ´ng viĂªn thĂ nh cĂ´ng!', 'success');
        navigate(`/parks/${parkId}`);
      } catch (err) {
        console.error("Lá»—i táº¡o cĂ´ng viĂªn:", err.response?.data);
        
        // Xá»­ lĂ½ hiá»ƒn thá»‹ lá»—i thĂ¢n thiá»‡n hÆ¡n
        let errorMsg = 'Lá»—i khi táº¡o cĂ´ng viĂªn';
        if (err.response?.data) {
          // Náº¿u lá»—i lĂ  trĂ¹ng tĂªn (tá»« validator backend)
          if (err.response.data.ten_cong_vien) {
            errorMsg = err.response.data.ten_cong_vien[0];
          } else {
            // CĂ¡c lá»—i khĂ¡c
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

  // Xá»­ lĂ½ chá»n áº£nh cĂ´ng viĂªn
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

  // Xá»­ lĂ½ xĂ³a áº£nh cĂ´ng viĂªn Ä‘Ă£ chá»n
  const handleRemoveParkImage = (index) => {
    setParkImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Xá»­ lĂ½ checkbox tiá»‡n Ă­ch
  const handleAmenityCheck = (key) => {
    setAmenities(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }));
  };

  // Xá»­ lĂ½ áº£nh tiá»‡n Ă­ch
  const handleAmenityImageChange = (key, e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Giá»›i háº¡n 2 áº£nh
      const currentLength = amenities[key].images.length;
      const newFiles = filesArray.slice(0, 2 - currentLength);
      
      setAmenities(prev => ({
        ...prev,
        [key]: { ...prev[key], images: [...prev[key].images, ...newFiles] }
      }));
    }
  };

  // Xá»­ lĂ½ xĂ³a áº£nh tiá»‡n Ă­ch Ä‘Ă£ chá»n
  const handleRemoveAmenityImage = (key, index) => {
    setAmenities((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        images: prev[key].images.filter((_, i) => i !== index),
      },
    }));
  };

  // Xá»­ lĂ½ ghi chĂº tiá»‡n Ă­ch
  const handleAmenityDescriptionChange = (key, value) => {
    setAmenities(prev => ({
      ...prev,
      [key]: { ...prev[key], description: value }
    }));
  };

  // Xá»­ lĂ½ sá»‘ lÆ°á»£ng tiá»‡n Ă­ch
  const handleAmenityQuantityChange = (key, value) => {
    setAmenities(prev => ({
      ...prev,
      [key]: { ...prev[key], quantity: parseInt(value) || 1 }
    }));
  };

  // Xá»­ lĂ½ thĂªm cĂ¢y
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

  // Xá»­ lĂ½ thay Ä‘á»•i cĂ¢y
  const handleTreeChange = (index, field, value) => {
    setTrees(prev => {
      const newTrees = [...prev];
      newTrees[index] = { ...newTrees[index], [field]: value };
      return newTrees;
    });
  };

  // Xá»­ lĂ½ xĂ³a cĂ¢y
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
        <h1>Táº¡o CĂ´ng ViĂªn</h1>
        <p>Äiá»n Ä‘áº§y Ä‘á»§ thĂ´ng tin cĂ´ng viĂªn</p>
      </div>

      <form onSubmit={handleSubmit} className="park-form">
        <div className="form-section">
          <h2>ThĂ´ng Tin CÆ¡ Báº£n</h2>

          <div className="form-group">
            <label htmlFor="tens">TĂªn CĂ´ng ViĂªn *</label>
            <input
              id="tens"
              name="tens"
              type="text"
              value={values.tens}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Vd: CĂ´ng viĂªn Tao ÄĂ n"
              required
            />
            {touched.tens && errors.tens && <span className="error">{errors.tens}</span>}
          </div>

          <div className="form-group">
            <RichTextEditor
              name="mo_ta"
              label="MĂ´ Táº£ Chi Tiáº¿t (Tá»‘i thiá»ƒu 250 kĂ½ tá»±) *"
              value={values.mo_ta}
              onChange={(nextValue) => setFieldValue('mo_ta', nextValue)}
              onBlur={handleBlur}
              placeholder="Viáº¿t mĂ´ táº£ chi tiáº¿t, dĂ i vá» cĂ´ng viĂªn. HĂ£y ká»ƒ vá» lá»‹ch sá»­, cĂ¡c tiá»‡n Ă­ch, cáº£nh quan, vĂ  lá»£i Ă­ch Ä‘Ă³ mang láº¡i cho cá»™ng Ä‘á»“ng. Tá»‘i thiá»ƒu 250 kĂ½ tá»±..."
              helperText="Ná»™i dung nĂ y sáº½ hiá»ƒn thá»‹ á»Ÿ trang bĂ i viáº¿t vĂ  chi tiáº¿t cĂ´ng viĂªn."
              minLength={250}
              error={touched.mo_ta && errors.mo_ta ? errors.mo_ta : ''}
            />
          </div>

          <div className="form-group">
            <RichTextEditor
              name="lich_su"
              label="Lá»‹ch Sá»­ VĂ  Bá»‘i Cáº£nh (TĂ¹y chá»n)"
              value={values.lich_su}
              onChange={(nextValue) => setFieldValue('lich_su', nextValue)}
              onBlur={handleBlur}
              placeholder="Bá»• sung lá»‹ch sá»­ hĂ¬nh thĂ nh, cĂ¡c dáº¥u má»‘c phĂ¡t triá»ƒn vĂ  bá»‘i cáº£nh cá»§a cĂ´ng viĂªn."
              helperText="Pháº§n nĂ y sáº½ hiá»ƒn thá»‹ á»Ÿ má»¥c lá»‹ch sá»­ trong bĂ i viáº¿t cĂ´ng viĂªn."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dien_tich_m2">Diá»‡n TĂ­ch (mÂ²) *</label>
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
              <label htmlFor="ma_quan_huyen">Quáº­n Huyá»‡n *</label>
              <select
                id="ma_quan_huyen"
                name="ma_quan_huyen"
                value={values.ma_quan_huyen}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="">-- Chá»n Quáº­n/Huyá»‡n --</option>
                {districts.map((d) => (
                  <option key={d.ma_quan_huyen} value={d.ma_quan_huyen}>
                    {d.ten_quan_huyen}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ma_trang_thai">Tráº¡ng ThĂ¡i *</label>
            <select
              id="ma_trang_thai"
              name="ma_trang_thai"
              value={values.ma_trang_thai}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">-- Chá»n Tráº¡ng ThĂ¡i --</option>
              {parkStatuses.map((s) => (
                <option key={s.ma_trang_thai} value={s.ma_trang_thai}>
                  {s.mo_ta || s.ten_trang_thai}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ma_loai">Loáº¡i CĂ´ng ViĂªn *</label>
            <select
              id="ma_loai"
              name="ma_loai"
              value={values.ma_loai}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">-- Chá»n Loáº¡i CĂ´ng ViĂªn --</option>
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
            <label htmlFor="seo_keywords">Tá»« khĂ³a tĂ¬m kiáº¿m (tĂ¹y chá»n)</label>
            <textarea
              id="seo_keywords"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="Nháº­p cĂ¡c tá»« khĂ³a liĂªn quan Ä‘Æ°á»£c phĂ¢n cĂ¡ch báº±ng dáº¥u pháº©y. VD: cĂ´ng viĂªn Quáº­n 1, cĂ´ng viĂªn xanh táº¡i TP.HCM, Ä‘á»‹a Ä‘iá»ƒm vui chÆ¡i gia Ä‘Ă¬nh"
              rows={3}
              style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}
            />
            <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
              GiĂºp tá»‘i Æ°u hĂ³a cĂ´ng cá»¥ tĂ¬m kiáº¿m
            </small>
          </div>
        </div>

        <div className="form-section">
          <h2>Vá»‹ TrĂ­ (Tá»a Äá»™)</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="toa_do_trung_tam_lat">VÄ© Äá»™ (Latitude) *</label>
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
              <label htmlFor="toa_do_trung_tam_lng">Kinh Äá»™ (Longitude) *</label>
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
            <label htmlFor="dia_chi">Äá»‹a Chá»‰ Chi Tiáº¿t *</label>
            <textarea
              id="dia_chi"
              name="dia_chi"
              value={values.dia_chi}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Vd: Tá»‘ Há»¯u, Quáº­n 4, TP. Há»“ ChĂ­ Minh"
              rows={2}
              style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}
              required
            />
            {touched.dia_chi && errors.dia_chi && <span className="error">{errors.dia_chi}</span>}
          </div>
        </div>

        {/* Pháº§n HĂ¬nh áº¢nh CĂ´ng ViĂªn */}
        <div className="form-section">
          <h2>HĂ¬nh áº¢nh CĂ´ng ViĂªn (Tá»‘i thiá»ƒu 4 áº£nh cháº¥t lÆ°á»£ng cao)</h2>
          <small style={{color: '#666', display: 'block', marginBottom: '10px'}}>
            Táº£i lĂªn cĂ¡c hĂ¬nh áº£nh cháº¥t lÆ°á»£ng cao, Ä‘a dáº¡ng (toĂ n cáº£nh, tiá»‡n Ă­ch, cĂ¢y cá», v.v.) Ä‘á»ƒ tá»‘i Æ°u hĂ³a SEO vĂ  thu hĂºt du khĂ¡ch
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
                  >Ă—</button>
                </div>
              ))}
            </div>
            {parkImages.length < 4 && <span className="error">â  Hiá»‡n táº¡i: {parkImages.length} áº£nh. Cáº§n thĂªm Ă­t nháº¥t {4 - parkImages.length} áº£nh ná»¯a.</span>}
            {parkImages.length >= 4 && <span style={{color: '#4CAF50', fontSize: '12px'}}>Äáº¡t yĂªu cáº§u tá»‘i thiá»ƒu</span>}
          </div>
        </div>

        {/* Pháº§n Tiá»‡n Ăch */}
        <div className="form-section">
          <h2>Tiá»‡n Ăch CĂ³ Sáºµn</h2>
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
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Sá»‘ lÆ°á»£ng:</label>
                      <input 
                        type="number" 
                        min="1"
                        value={amenities[key].quantity}
                        onChange={(e) => handleAmenityQuantityChange(key, e.target.value)}
                        style={{width: '100px', padding: '5px'}}
                      />
                    </div>

                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Táº£i lĂªn 2 áº£nh minh há»a:</label>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => handleAmenityImageChange(key, e)}
                      disabled={amenities[key].images.length >= 2}
                    />
                    
                    {/* Preview áº£nh tiá»‡n Ă­ch */}
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
                          >Ă—</button>
                        </div>
                      ))}
                    </div>

                    <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>ÄĂ£ chá»n: {amenities[key].images.length}/2 áº£nh</div>
                    
                    <label style={{display: 'block', marginTop: '15px', marginBottom: '5px', fontWeight: 'bold'}}>
                      MĂ´ táº£ chi tiáº¿t (Tá»‘i thiá»ƒu 150 kĂ½ tá»±) *
                    </label>
                    <textarea
                      placeholder={`MĂ´ táº£ chi tiáº¿t ${amenities[key].label}. Giá»›i thiá»‡u cĂ¡c tiá»‡n Ă­ch, Ä‘iá»u kiá»‡n vá»‡ sinh, giá» má»Ÿ cá»­a, chi phĂ­ sá»­ dá»¥ng...`}
                      value={amenities[key].description}
                      onChange={(e) => handleAmenityDescriptionChange(key, e.target.value)}
                      rows={4}
                      style={{width: '100%', marginTop: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                    />
                    <div style={{fontSize: '12px', color: amenities[key].description?.length >= 150 ? '#4CAF50' : '#FF9800', marginTop: '5px'}}>
                      {amenities[key].description ? `${amenities[key].description.length} kĂ½ tá»±` : '0 kĂ½ tá»±'} (Khuyáº¿n nghá»‹: â‰¥150 kĂ½ tá»±)
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pháº§n CĂ¢y Xanh */}
        <div className="form-section">
          <h2>CĂ¢y Xanh (TĂ¹y Chá»n)</h2>
          <small style={{color: '#666', display: 'block', marginBottom: '10px'}}>
            Nháº­p thĂ´ng tin chi tiáº¿t vá» cĂ¡c cĂ¢y trong cĂ´ng viĂªn
          </small>

          {trees.map((tree, idx) => (
            <div key={idx} style={{marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{margin: 0}}>CĂ¢y thá»© {idx + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveTree(idx)}
                  style={{background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}
                >
                  XĂ³a cĂ¢y nĂ y
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loáº¡i CĂ¢y *</label>
                  <select
                    value={tree.ma_loai_cay}
                    onChange={(e) => handleTreeChange(idx, 'ma_loai_cay', e.target.value)}
                    required
                  >
                    <option value="">-- Chá»n Loáº¡i CĂ¢y --</option>
                    {treeTypes.map((t) => (
                      <option key={t.ma_loai_cay} value={t.ma_loai_cay}>
                        {t.ten_loai}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`ma_so_cay_${idx}`}>MĂ£ Sá»‘ CĂ¢y</label>
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
                  <label htmlFor={`chieu_cao_${idx}`}>Chiá»u Cao (mĂ©t)</label>
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
                  <label htmlFor={`duong_kinh_${idx}`}>ÄÆ°á»ng KĂ­nh (cm)</label>
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
                  <label htmlFor={`ban_kinh_${idx}`}>BĂ¡n KĂ­nh TĂ¡n (mĂ©t)</label>
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
                  <label htmlFor={`tinh_trang_${idx}`}>TĂ¬nh Tráº¡ng</label>
                  <select
                    id={`tinh_trang_${idx}`}
                    value={tree.tinh_trang}
                    onChange={(e) => handleTreeChange(idx, 'tinh_trang', e.target.value)}
                  >
                    <option value="tot">Tá»‘t</option>
                    <option value="kha">KhĂ¡</option>
                    <option value="trung_binh">Trung BĂ¬nh</option>
                    <option value="kem">KĂ©m</option>
                    <option value="chet">Cháº¿t</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`ngay_trong_${idx}`}>NgĂ y Trá»“ng</label>
                  <input
                    id={`ngay_trong_${idx}`}
                    type="date"
                    value={tree.ngay_trong}
                    onChange={(e) => handleTreeChange(idx, 'ngay_trong', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`ngay_cat_tia_${idx}`}>NgĂ y Cáº¯t Tá»‰a Cuá»‘i</label>
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
            + ThĂªm CĂ¢y
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Äang lÆ°u...' : 'Táº¡o CĂ´ng ViĂªn'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/parks-list')}
            className="btn btn-ghost btn-large"
          >
            Há»§y
          </button>
        </div>
      </form>

    </div>
  );
}
