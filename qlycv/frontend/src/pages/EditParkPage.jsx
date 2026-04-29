import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '../hooks';
import { parksAPI, districtsAPI, parkTypesAPI, amenitiesAPI, imagesAPI, treesAPI } from '../api';
import { useUIStore, useAuthStore } from '../store';
import { MAP_CONFIG } from '../constants';
import RichTextEditor from '../components/Form/RichTextEditor';
import ParkLocationPicker from '../components/Form/ParkLocationPicker';
import '../styles/pages/ParkFormPage.css';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix lÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i icon mÄ‚Â¡Ă‚ÂºĂ‚Â·c Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹nh cÄ‚Â¡Ă‚Â»Ă‚Â§a Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component xÄ‚Â¡Ă‚Â»Ă‚Â­ lĂ„â€Ă‚Â½ sÄ‚Â¡Ă‚Â»Ă‚Â± kiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n click trĂ„â€Ă‚Âªn bÄ‚Â¡Ă‚ÂºĂ‚Â£n Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“
function LocationMarker({ setFieldValue }) {
  useMapEvents({
    click(e) {
      setFieldValue('toa_do_trung_tam_lat', e.latlng.lat.toFixed(6));
      setFieldValue('toa_do_trung_tam_lng', e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

// Component Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă†â€™ cÄ‚Â¡Ă‚ÂºĂ‚Â­p nhÄ‚Â¡Ă‚ÂºĂ‚Â­t view bÄ‚Â¡Ă‚ÂºĂ‚Â£n Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“ khi tÄ‚Â¡Ă‚Â»Ă‚Âa Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â€Â¢ thay Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¢i tÄ‚Â¡Ă‚Â»Ă‚Â« input
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

// FIX: Ä‚â€Ă‚ÂÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹nh nghÄ‚â€Ă‚Â©a tÄ‚Â¡Ă‚ÂºĂ‚Â¡m API status tÄ‚Â¡Ă‚ÂºĂ‚Â¡i Ä‚â€Ă¢â‚¬ËœĂ„â€Ă‚Â¢y
const parkStatusesAPI = {
  getList: async () => {
    try {
      const response = await fetch('/api/trang-thai-cong-vien/');
      const data = await response.json();
      return { data };
    } catch (e) {
      console.error("LÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i tÄ‚Â¡Ă‚ÂºĂ‚Â£i status:", e);
      return { data: [] };
    }
  }
};

export default function EditParkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const { user } = useAuthStore();
  const [park, setPark] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [parkTypes, setParkTypes] = useState([]);
  const [parkStatuses, setParkStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amenityTypes, setAmenityTypes] = useState([]);
  const [treeTypes, setTreeTypes] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [boundary, setBoundary] = useState(null); // State lÄ‚â€ Ă‚Â°u ranh giÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi (GeoJSON)
  
  // State Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â€Â¢ng
  const [amenities, setAmenities] = useState({});
  const [trees, setTrees] = useState([]); // State cho danh sĂ„â€Ă‚Â¡ch cĂ„â€Ă‚Â¢y

  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';
  const isManagerOwnPark = user?.nhom_quyen_code === 'QUAN_LY' && String(user?.ma_cong_vien) === String(id);

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } = useForm(
    {
      tens: '',
      mo_ta: '',
      lich_su: '',
      dien_tich_m2: '',
      ma_trang_thai: '',
      ma_loai: '',
      ma_quan_huyen: '',
      dia_chi: '',
      gio_mo_cua: '',
      gio_dong_cua: '',
      mo_cua_24_7: false,
      toa_do_trung_tam_lat: '',
      toa_do_trung_tam_lng: '',
    },
    async (values) => {
      try {
        const parkData = {
          ten_cong_vien: values.tens, // SÄ‚Â¡Ă‚Â»Ă‚Â­a tĂ„â€Ă‚Âªn trÄ‚â€ Ă‚Â°Ä‚Â¡Ă‚Â»Ă‚Âng cho khÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºp backend
          mo_ta: values.mo_ta,
          lich_su: values.lich_su,
          dien_tich_m2: parseFloat(values.dien_tich_m2),
          ma_quan_huyen: values.ma_quan_huyen,
          dia_chi: values.dia_chi,
          mo_cua_24_7: Boolean(values.mo_cua_24_7),
          gio_mo_cua: values.mo_cua_24_7 ? null : (values.gio_mo_cua || null),
          gio_dong_cua: values.mo_cua_24_7 ? null : (values.gio_dong_cua || null),
          toa_do_trung_tam: [
            parseFloat(values.toa_do_trung_tam_lat),
            parseFloat(values.toa_do_trung_tam_lng),
          ],
          ranh_gioi: boundary // GÄ‚Â¡Ă‚Â»Ă‚Â­i ranh giÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi vÄ‚Â¡Ă‚Â»Ă‚Â backend
        };

        if (isAdmin) {
          parkData.ma_trang_thai = values.ma_trang_thai;
          parkData.ma_loai = values.ma_loai;
        }

        const response = await parksAPI.update(id, parkData);

        // Upload Ä‚Â¡Ă‚ÂºĂ‚Â£nh mÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi (nÄ‚Â¡Ă‚ÂºĂ‚Â¿u cĂ„â€Ă‚Â³)
        if (newImages.length > 0) {
          for (const file of newImages) {
            const formData = new FormData();
            formData.append('ma_cong_vien', id);
            formData.append('url_anh', file);
            try {
              await imagesAPI.create(formData);
            } catch (e) { console.error("LÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i upload Ä‚Â¡Ă‚ÂºĂ‚Â£nh", e); }
          }
        }

        // CÄ‚Â¡Ă‚ÂºĂ‚Â­p nhÄ‚Â¡Ă‚ÂºĂ‚Â­t tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch
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

            // GÄ‚Â¡Ă‚Â»Ă‚Â­i kĂ„â€Ă‚Â¨m file Ä‚Â¡Ă‚ÂºĂ‚Â£nh tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch mÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi (nÄ‚Â¡Ă‚ÂºĂ‚Â¿u cĂ„â€Ă‚Â³)
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

        // 4. Cap nhat danh sach cay
        for (const tree of trees) {
          if (!tree.ma_loai_cay) {
            continue;
          }

          const treeData = {
            ma_cong_vien: id,
            ma_loai_cay: tree.ma_loai_cay,
            ma_so_cay: tree.ma_cay ? (tree.ma_so_cay || null) : null,
            chieu_cao_m: tree.chieu_cao_m ? parseFloat(tree.chieu_cao_m) : null,
            duong_kinh_cm: tree.duong_kinh_cm ? parseFloat(tree.duong_kinh_cm) : null,
            ban_kinh_tan_m: tree.ban_kinh_tan_m ? parseFloat(tree.ban_kinh_tan_m) : null,
            tinh_trang: tree.tinh_trang || 'tot',
            ngay_trong: tree.ngay_trong || null,
            ngay_cat_tia_cuoi: tree.ngay_cat_tia_cuoi || null,
          };

          try {
            if (tree.ma_cay) {
              await treesAPI.update(tree.ma_cay, treeData);
            } else {
              const quantity = Math.max(1, Number.parseInt(tree.so_luong, 10) || 1);
              for (let index = 0; index < quantity; index += 1) {
                await treesAPI.create(treeData);
              }
            }
          } catch (e) {
            console.error('Loi cap nhat/tao cay:', e);
          }
        }
        showNotification('CÄ‚Â¡Ă‚ÂºĂ‚Â­p nhÄ‚Â¡Ă‚ÂºĂ‚Â­t cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn thĂ„â€Ă‚Â nh cĂ„â€Ă‚Â´ng!', 'success');
        navigate(`/parks/${id}`);
      } catch (err) {
        let errorMsg = 'LÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i khi cÄ‚Â¡Ă‚ÂºĂ‚Â­p nhÄ‚Â¡Ă‚ÂºĂ‚Â­t cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn';
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
    if (window.confirm('BÄ‚Â¡Ă‚ÂºĂ‚Â¡n cĂ„â€Ă‚Â³ chÄ‚Â¡Ă‚ÂºĂ‚Â¯c chÄ‚Â¡Ă‚ÂºĂ‚Â¯n muÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœn xĂ„â€Ă‚Â³a cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn nĂ„â€Ă‚Â y? HĂ„â€Ă‚Â nh Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â€Â¢ng nĂ„â€Ă‚Â y khĂ„â€Ă‚Â´ng thÄ‚Â¡Ă‚Â»Ă†â€™ hoĂ„â€Ă‚Â n tĂ„â€Ă‚Â¡c.')) {
      try {
        await parksAPI.delete(id);
        showNotification('XĂ„â€Ă‚Â³a cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn thĂ„â€Ă‚Â nh cĂ„â€Ă‚Â´ng!', 'success');
        navigate('/parks-list');
      } catch (err) {
        showNotification(
          err.response?.data?.detail || 'LÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i khi xĂ„â€Ă‚Â³a cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn',
          'error'
        );
      }
    }
  };

  useEffect(() => {
    const fetchPark = async () => {
      try {
        if (!isAdmin && user?.nhom_quyen_code === 'QUAN_LY' && !isManagerOwnPark) {
          showNotification('Manager chi duoc chinh sua cong vien duoc gan cho minh', 'error');
          navigate(user?.ma_cong_vien ? `/parks/${user.ma_cong_vien}` : '/parks-list');
          return;
        }
        // TÄ‚Â¡Ă‚ÂºĂ‚Â£i dÄ‚Â¡Ă‚Â»Ă‚Â¯ liÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡u cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn VĂ„â€Ă¢â€Â¬ danh mÄ‚Â¡Ă‚Â»Ă‚Â¥c cĂ„â€Ă‚Â¹ng lĂ„â€Ă‚Âºc
        // FIX: ThĂ„â€Ă‚Âªm parkStatusesAPI.getList() vĂ„â€Ă‚Â o danh sĂ„â€Ă‚Â¡ch Promise
        const [response, districtsRes, typesRes, amenitiesRes, parkAmenitiesRes, statusesRes, treeTypesRes, parkTreesRes] = await Promise.all([
          parksAPI.getDetail(id),
          districtsAPI.getList({ limit: 100 }),
          parkTypesAPI.getList(),
          amenitiesAPI.getTypes(),
          amenitiesAPI.getList({ ma_cong_vien: id }),
          parkStatusesAPI.getList(),
          treesAPI.getTypes(),
          treesAPI.getList({ ma_cong_vien: id })
        ]);

        setPark(response.data);
        setDistricts(districtsRes.data.results || districtsRes.data);
        setParkTypes(typesRes.data.results || typesRes.data);
        setParkStatuses(statusesRes.data.results || statusesRes.data || []);
        setTreeTypes(treeTypesRes.data.results || treeTypesRes.data || []);
        setExistingImages(response.data.hinh_anh || []);
        
        // Load danh sĂ„â€Ă‚Â¡ch cĂ„â€Ă‚Â¢y hiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n cĂ„â€Ă‚Â³
        const parkTreesList = parkTreesRes.data.results || parkTreesRes.data || [];
        setTrees(parkTreesList.map(tree => ({
          ma_cay: tree.ma_cay,
          ma_loai_cay: tree.ma_loai_cay,
          ma_so_cay: tree.ma_so_cay || '',
          chieu_cao_m: tree.chieu_cao_m || '',
          duong_kinh_cm: tree.duong_kinh_cm || '',
          ban_kinh_tan_m: tree.ban_kinh_tan_m || '',
          tinh_trang: tree.tinh_trang || 'tot',
          ngay_trong: tree.ngay_trong || '',
          ngay_cat_tia_cuoi: tree.ngay_cat_tia_cuoi || ''
        })));
        
        // Pre-fill form
        setFieldValue('tens', response.data.ten_cong_vien || response.data.tens);
        setFieldValue('mo_ta', response.data.mo_ta || '');
        setFieldValue('lich_su', response.data.lich_su || '');
        setFieldValue('dien_tich_m2', response.data.dien_tich_m2);
        setFieldValue('dia_chi', response.data.dia_chi || '');
        setFieldValue('gio_mo_cua', response.data.gio_mo_cua || '');
        setFieldValue('gio_dong_cua', response.data.gio_dong_cua || '');
        setFieldValue('mo_cua_24_7', Boolean(response.data.mo_cua_24_7));
        
        // FIX: LÄ‚Â¡Ă‚ÂºĂ‚Â¥y ID nÄ‚Â¡Ă‚ÂºĂ‚Â¿u API trÄ‚Â¡Ă‚ÂºĂ‚Â£ vÄ‚Â¡Ă‚Â»Ă‚Â object, hoÄ‚Â¡Ă‚ÂºĂ‚Â·c lÄ‚Â¡Ă‚ÂºĂ‚Â¥y giĂ„â€Ă‚Â¡ trÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ trÄ‚Â¡Ă‚Â»Ă‚Â±c tiÄ‚Â¡Ă‚ÂºĂ‚Â¿p nÄ‚Â¡Ă‚ÂºĂ‚Â¿u lĂ„â€Ă‚Â  ID
        // Ä‚â€Ă‚ÂÄ‚â€ Ă‚Â¡n giÄ‚Â¡Ă‚ÂºĂ‚Â£n hĂ„â€Ă‚Â³a logic: API trÄ‚Â¡Ă‚ÂºĂ‚Â£ vÄ‚Â¡Ă‚Â»Ă‚Â ID, chÄ‚Â¡Ă‚Â»Ă¢â‚¬Â° cÄ‚Â¡Ă‚ÂºĂ‚Â§n gĂ„â€Ă‚Â¡n trÄ‚Â¡Ă‚Â»Ă‚Â±c tiÄ‚Â¡Ă‚ÂºĂ‚Â¿p
        setFieldValue('ma_loai', response.data.ma_loai || '');

        // FIX: ThĂ„â€Ă‚Âªm logic cĂ„â€Ă‚Â²n thiÄ‚Â¡Ă‚ÂºĂ‚Â¿u Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă†â€™ gĂ„â€Ă‚Â¡n giĂ„â€Ă‚Â¡ trÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ cho TrÄ‚Â¡Ă‚ÂºĂ‚Â¡ng thĂ„â€Ă‚Â¡i vĂ„â€Ă‚Â  QuÄ‚Â¡Ă‚ÂºĂ‚Â­n HuyÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n
        setFieldValue('ma_quan_huyen', response.data.ma_quan_huyen || '');
        setFieldValue('ma_trang_thai', response.data.ma_trang_thai || '');
        
        if (response.data.toa_do_trung_tam) {
          setFieldValue('toa_do_trung_tam_lat', response.data.toa_do_trung_tam[0]);
          setFieldValue('toa_do_trung_tam_lng', response.data.toa_do_trung_tam[1]);
        }
        
        if (response.data.ranh_gioi) {
          setBoundary(response.data.ranh_gioi);
        }

        // Map tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch hiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n cĂ„â€Ă‚Â³ vĂ„â€Ă‚Â o state
        const existingAmenities = parkAmenitiesRes.data.results || parkAmenitiesRes.data;
        const types = amenitiesRes.data.results || amenitiesRes.data;
        
        setAmenityTypes(types);

        // KhÄ‚Â¡Ă‚Â»Ă…Â¸i tÄ‚Â¡Ă‚ÂºĂ‚Â¡o state Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â€Â¢ng dÄ‚Â¡Ă‚Â»Ă‚Â±a trĂ„â€Ă‚Âªn danh sĂ„â€Ă‚Â¡ch loÄ‚Â¡Ă‚ÂºĂ‚Â¡i tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch
        const newAmenitiesState = {};
        types.forEach(type => {
          newAmenitiesState[type.ma_code] = {
            checked: false, newImages: [], existingImages: [], 
            label: type.ten_loai, code: type.ma_code, id_type: type.ma_loai_tien_ich,
            description: '', quantity: 1, id: null 
          };
        });

        // Ä‚â€Ă‚ÂiÄ‚Â¡Ă‚Â»Ă‚Ân dÄ‚Â¡Ă‚Â»Ă‚Â¯ liÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡u cÄ‚â€¦Ă‚Â© vĂ„â€Ă‚Â o
        existingAmenities.forEach(am => {
          // TĂ„â€Ă‚Â¬m key tÄ‚â€ Ă‚Â°Ä‚â€ Ă‚Â¡ng Ä‚Â¡Ă‚Â»Ă‚Â©ng dÄ‚Â¡Ă‚Â»Ă‚Â±a trĂ„â€Ă‚Âªn ma_loai_tien_ich
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
        showNotification('KhĂ„â€Ă‚Â´ng thÄ‚Â¡Ă‚Â»Ă†â€™ tÄ‚Â¡Ă‚ÂºĂ‚Â£i thĂ„â€Ă‚Â´ng tin cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn', 'error');
        navigate('/parks-list');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPark();
    }
  }, [id, navigate, showNotification, user?.ma_cong_vien, user?.nhom_quyen_code]);

  // Handlers cho tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch
  const handleLocationPick = (nextLat, nextLng) => {
    setFieldValue('toa_do_trung_tam_lat', Number(nextLat).toFixed(6));
    setFieldValue('toa_do_trung_tam_lng', Number(nextLng).toFixed(6));
  };

  const handleAmenityCheck = (key) => {
    setAmenities(prev => ({ ...prev, [key]: { ...prev[key], checked: !prev[key].checked } }));
  };

  const handleAmenityQuantityChange = (key, value) => {
    setAmenities(prev => ({ ...prev, [key]: { ...prev[key], quantity: parseInt(value) || 1 } }));
  };

  const handleAmenityDescriptionChange = (key, value) => {
    setAmenities(prev => ({ ...prev, [key]: { ...prev[key], description: value } }));
  };

  // Handlers cho Ä‚Â¡Ă‚ÂºĂ‚Â£nh tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch
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

  // Handlers cho hĂ„â€Ă‚Â¬nh Ä‚Â¡Ă‚ÂºĂ‚Â£nh
  const handleNewImageChange = (e) => {
    if (e.target.files) {
      setNewImages(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers cho cĂ„â€Ă‚Â¢y
  const handleAddTree = () => {
    setTrees(prev => [...prev, {
      ma_loai_cay: '',
      so_luong: '1',
      chieu_cao_m: '',
      duong_kinh_cm: '',
      ban_kinh_tan_m: '',
      tinh_trang: 'tot',
      ngay_trong: '',
      ngay_cat_tia_cuoi: ''
    }]);
  };

  const handleTreeChange = (index, field, value) => {
    setTrees(prev => {
      const newTrees = [...prev];
      newTrees[index] = { ...newTrees[index], [field]: value };
      return newTrees;
    });
  };

  const handleRemoveTree = (index) => {
    const tree = trees[index];
    if (tree.ma_cay) {
      // XĂ„â€Ă‚Â³a dari server nÄ‚Â¡Ă‚ÂºĂ‚Â¿u lĂ„â€Ă‚Â  tree cÄ‚â€¦Ă‚Â©
      if (window.confirm('BÄ‚Â¡Ă‚ÂºĂ‚Â¡n cĂ„â€Ă‚Â³ chÄ‚Â¡Ă‚ÂºĂ‚Â¯c chÄ‚Â¡Ă‚ÂºĂ‚Â¯n muÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœn xĂ„â€Ă‚Â³a cĂ„â€Ă‚Â¢y nĂ„â€Ă‚Â y?')) {
        try {
          // Backend khĂ„â€Ă‚Â´ng cĂ„â€Ă‚Â³ delete endpoint tÄ‚â€ Ă‚Â°Ä‚Â¡Ă‚Â»Ă‚Âng minh,  chÄ‚Â¡Ă‚Â»Ă¢â‚¬Â° cÄ‚Â¡Ă‚ÂºĂ‚Â§n update
          setTrees(prev => prev.filter((_, i) => i !== index));
        } catch (e) {
          showNotification('LÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i khi xĂ„â€Ă‚Â³a cĂ„â€Ă‚Â¢y', 'error');
        }
      }
    } else {
      setTrees(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (window.confirm('BÄ‚Â¡Ă‚ÂºĂ‚Â¡n cĂ„â€Ă‚Â³ chÄ‚Â¡Ă‚ÂºĂ‚Â¯c chÄ‚Â¡Ă‚ÂºĂ‚Â¯n muÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœn xĂ„â€Ă‚Â³a Ä‚Â¡Ă‚ÂºĂ‚Â£nh nĂ„â€Ă‚Â y?')) {
      try {
        await imagesAPI.delete(imageId);
        setExistingImages(prev => prev.filter(img => img.ma_hinh_anh !== imageId));
        showNotification('Ä‚â€Ă‚ÂĂ„â€Ă‚Â£ xĂ„â€Ă‚Â³a Ä‚Â¡Ă‚ÂºĂ‚Â£nh', 'success');
      } catch (e) {
        showNotification('LÄ‚Â¡Ă‚Â»Ă¢â‚¬â€i khi xĂ„â€Ă‚Â³a Ä‚Â¡Ă‚ÂºĂ‚Â£nh', 'error');
      }
    }
  };

  // XÄ‚Â¡Ă‚Â»Ă‚Â­ lĂ„â€Ă‚Â½ khi vÄ‚Â¡Ă‚ÂºĂ‚Â½ xong ranh giÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi
  const onCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const geojson = layer.toGeoJSON();
      setBoundary(geojson.geometry);
      showNotification('Ä‚â€Ă‚ÂĂ„â€Ă‚Â£ tÄ‚Â¡Ă‚ÂºĂ‚Â¡o ranh giÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi mÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi', 'info');
    }
  };

  // XÄ‚Â¡Ă‚Â»Ă‚Â­ lĂ„â€Ă‚Â½ khi chÄ‚Â¡Ă‚Â»Ă¢â‚¬Â°nh sÄ‚Â¡Ă‚Â»Ă‚Â­a ranh giÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi
  const onEdited = (e) => {
    const { layers } = e;
    layers.eachLayer((layer) => {
      const geojson = layer.toGeoJSON();
      setBoundary(geojson.geometry);
    });
  };

  // XÄ‚Â¡Ă‚Â»Ă‚Â­ lĂ„â€Ă‚Â½ khi xĂ„â€Ă‚Â³a ranh giÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi
  const onDeleted = () => {
    setBoundary(null);
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading-container card">
          <div className="spinner" />
          <p>Dang tai thong tin cong vien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="park-form-page">
      {/* LIGHT THEME FORCE STYLE */}
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { background-color: #f3f4f6 !important; color: #111827 !important; height: 100%; }
        
        /* SIDEBAR FIX */
        .sidebar, aside, .left-menu, .nav-menu, .main-sidebar, [class*="sidebar"], [class*="Sidebar"], [class*="Sider"], .pro-sidebar-inner {
            background-color: #ffffff !important;
            background: #ffffff !important;
            border-right: 1px solid #e5e7eb !important;
            box-shadow: 2px 0 10px rgba(0,0,0,0.05) !important;
        }
        .sidebar *, aside *, [class*="sidebar"] * {
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
        .sidebar .nav-link.active, .sidebar li.active > a, .sidebar a[aria-current="page"], .pro-menu-item.active {
            background-color: #e5e7eb !important;
            color: #000000 !important;
            font-weight: 700 !important;
            box-shadow: inset 4px 0 0 #3b82f6 !important;
        }
        .sidebar .active *, .sidebar .selected *, .sidebar [aria-current="page"] * { color: #000000 !important; }
      `}</style>
      <div className="form-header">
        <h1>ChÄ‚Â¡Ă‚Â»Ă¢â‚¬Â°nh SÄ‚Â¡Ă‚Â»Ă‚Â­a</h1>
        <p>{park?.ten_cong_vien || park?.tens}</p>
      </div>

      <form onSubmit={handleSubmit} className="park-form">
        <div className="form-section">
          <h2>ThĂ„â€Ă‚Â´ng Tin CÄ‚â€ Ă‚Â¡ BÄ‚Â¡Ă‚ÂºĂ‚Â£n</h2>

          <div className="form-group">
            <label htmlFor="tens">TĂ„â€Ă‚Âªn CĂ„â€Ă‚Â´ng ViĂ„â€Ă‚Âªn *</label>
            <input
              id="tens"
              name="tens"
              type="text"
              value={values.tens}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Vd: CĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn Tao Ä‚â€Ă‚ÂĂ„â€Ă‚Â n"
              required
            />
            {touched.tens && errors.tens && <span className="error">{errors.tens}</span>}
          </div>

          <div className="form-group">
            <RichTextEditor
              name="mo_ta"
              label="MĂ„â€Ă‚Â´ TÄ‚Â¡Ă‚ÂºĂ‚Â£ BĂ„â€Ă‚Â i ViÄ‚Â¡Ă‚ÂºĂ‚Â¿t"
              value={values.mo_ta}
              onChange={(nextValue) => setFieldValue('mo_ta', nextValue)}
              onBlur={handleBlur}
              placeholder="MĂ„â€Ă‚Â´ tÄ‚Â¡Ă‚ÂºĂ‚Â£ chi tiÄ‚Â¡Ă‚ÂºĂ‚Â¿t vÄ‚Â¡Ă‚Â»Ă‚Â cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn"
              helperText="Ä‚â€Ă‚ÂoÄ‚Â¡Ă‚ÂºĂ‚Â¡n nĂ„â€Ă‚Â y dĂ„â€Ă‚Â¹ng lĂ„â€Ă‚Â m nÄ‚Â¡Ă‚Â»Ă¢â€Â¢i dung chĂ„â€Ă‚Â­nh cÄ‚Â¡Ă‚Â»Ă‚Â§a bĂ„â€Ă‚Â i viÄ‚Â¡Ă‚ÂºĂ‚Â¿t cĂ„â€Ă‚Â´ng viĂ„â€Ă‚Âªn."
              minLength={250}
              error={touched.mo_ta && errors.mo_ta ? errors.mo_ta : ''}
            />
          </div>

          <div className="form-group">
            <RichTextEditor
              name="lich_su"
              label="LÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ch SÄ‚Â¡Ă‚Â»Ă‚Â­ VĂ„â€Ă‚Â  BÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœi CÄ‚Â¡Ă‚ÂºĂ‚Â£nh"
              value={values.lich_su}
              onChange={(nextValue) => setFieldValue('lich_su', nextValue)}
              onBlur={handleBlur}
              placeholder="BÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¢ sung lÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ch sÄ‚Â¡Ă‚Â»Ă‚Â­ hĂ„â€Ă‚Â¬nh thĂ„â€Ă‚Â nh, cĂ„â€Ă‚Â¡c giai Ä‚â€Ă¢â‚¬ËœoÄ‚Â¡Ă‚ÂºĂ‚Â¡n mÄ‚Â¡Ă‚Â»Ă…Â¸ rÄ‚Â¡Ă‚Â»Ă¢â€Â¢ng hoÄ‚Â¡Ă‚ÂºĂ‚Â·c dÄ‚Â¡Ă‚ÂºĂ‚Â¥u mÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœc nÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¢i bÄ‚Â¡Ă‚ÂºĂ‚Â­t."
              helperText="PhÄ‚Â¡Ă‚ÂºĂ‚Â§n nĂ„â€Ă‚Â y sÄ‚Â¡Ă‚ÂºĂ‚Â½ hiÄ‚Â¡Ă‚Â»Ă†â€™n thÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ Ä‚Â¡Ă‚Â»Ă…Â¸ mÄ‚Â¡Ă‚Â»Ă‚Â¥c lÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ch sÄ‚Â¡Ă‚Â»Ă‚Â­ trong trang bĂ„â€Ă‚Â i viÄ‚Â¡Ă‚ÂºĂ‚Â¿t."
            />
          </div>

          <div className="form-group">
            <label htmlFor="dia_chi">Ä‚â€Ă‚ÂÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹a ChÄ‚Â¡Ă‚Â»Ă¢â‚¬Â° Chi TiÄ‚Â¡Ă‚ÂºĂ‚Â¿t *</label>
            <textarea
              id="dia_chi"
              name="dia_chi"
              value={values.dia_chi}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Vd: TÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœ HÄ‚Â¡Ă‚Â»Ă‚Â¯u, QuÄ‚Â¡Ă‚ÂºĂ‚Â­n 4, TP. HÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“ ChĂ„â€Ă‚Â­ Minh"
              rows={2}
            />
            {touched.dia_chi && errors.dia_chi && <span className="error">{errors.dia_chi}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dien_tich_m2">DiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n TĂ„â€Ă‚Â­ch (mÄ‚â€Ă‚Â²) *</label>
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
              <label htmlFor="ma_quan_huyen">QuÄ‚Â¡Ă‚ÂºĂ‚Â­n HuyÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n *</label>
              <select
                id="ma_quan_huyen"
                name="ma_quan_huyen"
                value={values.ma_quan_huyen}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="">-- ChÄ‚Â¡Ă‚Â»Ă‚Ân QuÄ‚Â¡Ă‚ÂºĂ‚Â­n/HuyÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n --</option>
                {districts.map((d) => (
                  <option key={d.ma_quan_huyen} value={d.ma_quan_huyen}>
                    {d.ten_quan_huyen}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ma_trang_thai">TrÄ‚Â¡Ă‚ÂºĂ‚Â¡ng ThĂ„â€Ă‚Â¡i (ChÄ‚Â¡Ă‚Â»Ă‚Ân 'HoÄ‚Â¡Ă‚ÂºĂ‚Â¡t Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â€Â¢ng' Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă†â€™ hiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n trĂ„â€Ă‚Âªn bÄ‚Â¡Ă‚ÂºĂ‚Â£n Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“) *</label>
            <select
              id="ma_trang_thai"
              name="ma_trang_thai"
              value={values.ma_trang_thai}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isAdmin}
              required
            >
              <option value="">-- ChÄ‚Â¡Ă‚Â»Ă‚Ân TrÄ‚Â¡Ă‚ÂºĂ‚Â¡ng ThĂ„â€Ă‚Â¡i --</option>
              {parkStatuses.map((s) => (
                <option key={s.ma_trang_thai} value={s.ma_trang_thai}>
                  {s.mo_ta || s.ten_trang_thai}
                </option>
              ))}
            </select>
            {!isAdmin && <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>Manager khong duoc doi trang thai cong vien.</small>}
          </div>

          <div className="form-group">
            <label htmlFor="ma_loai">LoÄ‚Â¡Ă‚ÂºĂ‚Â¡i CĂ„â€Ă‚Â´ng ViĂ„â€Ă‚Âªn *</label>
            <select
              id="ma_loai"
              name="ma_loai"
              value={values.ma_loai}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isAdmin}
              required
            >
              <option value="">-- ChÄ‚Â¡Ă‚Â»Ă‚Ân LoÄ‚Â¡Ă‚ÂºĂ‚Â¡i CĂ„â€Ă‚Â´ng ViĂ„â€Ă‚Âªn --</option>
              {parkTypes.map((t) => (
                <option key={t.ma_loai} value={t.ma_loai}>
                  {t.ten_loai}
                </option>
              ))}
            </select>
            {!isAdmin && <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>Manager khong duoc doi loai cong vien.</small>}
          </div>
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

        <div className="form-section">
          <h2>VÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ TrĂ„â€Ă‚Â­ (TÄ‚Â¡Ă‚Â»Ă‚Âa Ä‚â€Ă‚ÂÄ‚Â¡Ă‚Â»Ă¢â€Â¢)</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="toa_do_trung_tam_lat">VÄ‚â€Ă‚Â© Ä‚â€Ă‚ÂÄ‚Â¡Ă‚Â»Ă¢â€Â¢ (Latitude) *</label>
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
              <label htmlFor="toa_do_trung_tam_lng">Kinh Ä‚â€Ă‚ÂÄ‚Â¡Ă‚Â»Ă¢â€Â¢ (Longitude) *</label>
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
            boundary={boundary}
            onBoundaryChange={setBoundary}
          />
          <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>
            Click bÄ‚Â¡Ă‚ÂºĂ‚Â£n Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“ Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă†â€™ ghim tĂ„â€Ă‚Â¢m. DĂ„â€Ă‚Â¹ng cĂ„â€Ă‚Â´ng cÄ‚Â¡Ă‚Â»Ă‚Â¥ hĂ„â€Ă‚Â¬nh ngÄ‚â€¦Ă‚Â© giĂ„â€Ă‚Â¡c (bĂ„â€Ă‚Âªn phÄ‚Â¡Ă‚ÂºĂ‚Â£i) Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă†â€™ vÄ‚Â¡Ă‚ÂºĂ‚Â½ ranh giÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi. 
            DiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n tĂ„â€Ă‚Â­ch sÄ‚Â¡Ă‚ÂºĂ‚Â½ Ä‚â€Ă¢â‚¬ËœÄ‚â€ Ă‚Â°Ä‚Â¡Ă‚Â»Ă‚Â£c tÄ‚Â¡Ă‚Â»Ă‚Â± Ä‚â€Ă¢â‚¬ËœÄ‚Â¡Ă‚Â»Ă¢â€Â¢ng tĂ„â€Ă‚Â­nh toĂ„â€Ă‚Â¡n khi bÄ‚Â¡Ă‚ÂºĂ‚Â¡n bÄ‚Â¡Ă‚ÂºĂ‚Â¥m CÄ‚Â¡Ă‚ÂºĂ‚Â­p NhÄ‚Â¡Ă‚ÂºĂ‚Â­t.
          </small>
        </div>

        {/* PhÄ‚Â¡Ă‚ÂºĂ‚Â§n HĂ„â€Ă‚Â¬nh Ä‚Â¡Ă‚ÂºĂ‚Â¢nh CĂ„â€Ă‚Â´ng ViĂ„â€Ă‚Âªn */}
        <div className="form-section">
          <h2>HĂ„â€Ă‚Â¬nh Ä‚Â¡Ă‚ÂºĂ‚Â¢nh CĂ„â€Ă‚Â´ng ViĂ„â€Ă‚Âªn</h2>
          
          {/* Ä‚Â¡Ă‚ÂºĂ‚Â¢nh hiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n cĂ„â€Ă‚Â³ */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Ä‚Â¡Ă‚ÂºĂ‚Â¢nh hiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n cĂ„â€Ă‚Â³:</label>
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
                      title="XĂ„â€Ă‚Â³a Ä‚Â¡Ă‚ÂºĂ‚Â£nh"
                    >Ă„â€Ă¢â‚¬â€</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ThĂ„â€Ă‚Âªm Ä‚Â¡Ă‚ÂºĂ‚Â£nh mÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi */}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ThĂ„â€Ă‚Âªm Ä‚Â¡Ă‚ÂºĂ‚Â£nh mÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi:</label>
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
                    >Ă„â€Ă¢â‚¬â€</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PhÄ‚Â¡Ă‚ÂºĂ‚Â§n TiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Âch */}
        <div className="form-section">
          <h2>TiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Âch</h2>
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
                      <label style={{fontWeight: 'bold', marginRight: '10px'}}>SÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœ lÄ‚â€ Ă‚Â°Ä‚Â¡Ă‚Â»Ă‚Â£ng:</label>
                      <input 
                        type="number" 
                        min="1"
                        value={amenities[key].quantity}
                        onChange={(e) => handleAmenityQuantityChange(key, e.target.value)}
                        style={{width: '80px', padding: '5px'}}
                      />
                    </div>

                    {/* QuÄ‚Â¡Ă‚ÂºĂ‚Â£n lĂ„â€Ă‚Â½ Ä‚Â¡Ă‚ÂºĂ‚Â£nh tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch */}
                    <div style={{marginBottom: '10px'}}>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>HĂ„â€Ă‚Â¬nh Ä‚Â¡Ă‚ÂºĂ‚Â£nh:</label>
                      
                      {/* Ä‚Â¡Ă‚ÂºĂ‚Â¢nh cÄ‚â€¦Ă‚Â© */}
                      {amenities[key].existingImages && amenities[key].existingImages.length > 0 && (
                        <div style={{display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap'}}>
                          {amenities[key].existingImages.map((url, idx) => (
                            <div key={`exist-${idx}`} style={{width: '60px', height: '60px', border: '1px solid #ddd'}}>
                              <img src={url} alt="Amenity" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Ä‚Â¡Ă‚ÂºĂ‚Â£nh mÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi */}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => handleAmenityImageChange(key, e)}
                      />
                      
                      {/* Preview Ä‚Â¡Ă‚ÂºĂ‚Â£nh mÄ‚Â¡Ă‚Â»Ă¢â‚¬Âºi */}
                      {amenities[key].newImages && amenities[key].newImages.length > 0 && (
                        <div style={{display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap'}}>
                          {amenities[key].newImages.map((file, idx) => (
                            <div key={`new-${idx}`} style={{width: '60px', height: '60px', border: '1px solid #ddd', position: 'relative'}}>
                              <img src={URL.createObjectURL(file)} alt="New" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                              <button type="button" onClick={() => handleRemoveAmenityNewImage(key, idx)} style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', width: '20px', height: '20px', cursor: 'pointer'}}>Ă„â€Ă¢â‚¬â€</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea
                      placeholder="MĂ„â€Ă‚Â´ tÄ‚Â¡Ă‚ÂºĂ‚Â£ chi tiÄ‚Â¡Ă‚ÂºĂ‚Â¿t tiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n Ă„â€Ă‚Â­ch..."
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

        {/* PhÄ‚Â¡Ă‚ÂºĂ‚Â§n CĂ„â€Ă‚Â¢y Xanh */}
        <div className="form-section">
          <h2>CĂ„â€Ă‚Â¢y Xanh (TĂ„â€Ă‚Â¹y ChÄ‚Â¡Ă‚Â»Ă‚Ân)</h2>

          {trees.map((tree, idx) => (
            <div key={idx} style={{marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{margin: 0}}>CĂ„â€Ă‚Â¢y thÄ‚Â¡Ă‚Â»Ă‚Â© {idx + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveTree(idx)}
                  style={{background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}
                >
                  XĂ„â€Ă‚Â³a cĂ„â€Ă‚Â¢y nĂ„â€Ă‚Â y
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>LoÄ‚Â¡Ă‚ÂºĂ‚Â¡i CĂ„â€Ă‚Â¢y *</label>
                  <select
                    value={tree.ma_loai_cay}
                    onChange={(e) => handleTreeChange(idx, 'ma_loai_cay', e.target.value)}
                    required
                  >
                    <option value="">-- ChÄ‚Â¡Ă‚Â»Ă‚Ân LoÄ‚Â¡Ă‚ÂºĂ‚Â¡i CĂ„â€Ă‚Â¢y --</option>
                    {treeTypes.map((t) => (
                      <option key={t.ma_loai_cay} value={t.ma_loai_cay}>
                        {t.ten_loai}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  {tree.ma_cay ? (
                    <>
                      <label htmlFor={`ma_so_cay_${idx}`}>Ma so cay</label>
                      <input
                        id={`ma_so_cay_${idx}`}
                        type="text"
                        value={tree.ma_so_cay}
                        onChange={(e) => handleTreeChange(idx, 'ma_so_cay', e.target.value)}
                        placeholder={`#${tree.ma_cay}`}
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor={`so_luong_${idx}`}>So luong</label>
                      <input
                        id={`so_luong_${idx}`}
                        type="number"
                        min="1"
                        value={tree.so_luong || '1'}
                        onChange={(e) => handleTreeChange(idx, 'so_luong', e.target.value)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`chieu_cao_${idx}`}>ChiÄ‚Â¡Ă‚Â»Ă‚Âu Cao (mĂ„â€Ă‚Â©t)</label>
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
                  <label htmlFor={`duong_kinh_${idx}`}>Ä‚â€Ă‚ÂÄ‚â€ Ă‚Â°Ä‚Â¡Ă‚Â»Ă‚Âng KĂ„â€Ă‚Â­nh (cm)</label>
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
                  <label htmlFor={`ban_kinh_${idx}`}>BĂ„â€Ă‚Â¡n KĂ„â€Ă‚Â­nh TĂ„â€Ă‚Â¡n (mĂ„â€Ă‚Â©t)</label>
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
                  <label htmlFor={`tinh_trang_${idx}`}>TĂ„â€Ă‚Â¬nh TrÄ‚Â¡Ă‚ÂºĂ‚Â¡ng</label>
                  <select
                    id={`tinh_trang_${idx}`}
                    value={tree.tinh_trang}
                    onChange={(e) => handleTreeChange(idx, 'tinh_trang', e.target.value)}
                  >
                    <option value="tot">TÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœt</option>
                    <option value="kha">KhĂ„â€Ă‚Â¡</option>
                    <option value="trung_binh">Trung BĂ„â€Ă‚Â¬nh</option>
                    <option value="kem">KĂ„â€Ă‚Â©m</option>
                    <option value="chet">ChÄ‚Â¡Ă‚ÂºĂ‚Â¿t</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`ngay_trong_${idx}`}>NgĂ„â€Ă‚Â y TrÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“ng</label>
                  <input
                    id={`ngay_trong_${idx}`}
                    type="date"
                    value={tree.ngay_trong}
                    onChange={(e) => handleTreeChange(idx, 'ngay_trong', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`ngay_cat_tia_${idx}`}>NgĂ„â€Ă‚Â y CÄ‚Â¡Ă‚ÂºĂ‚Â¯t TÄ‚Â¡Ă‚Â»Ă¢â‚¬Â°a CuÄ‚Â¡Ă‚Â»Ă¢â‚¬Ëœi</label>
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

          {isAdmin && <button
            type="button"
            onClick={handleAddTree}
            style={{background: '#4CAF50', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px'}}
          >
            + ThĂ„â€Ă‚Âªm CĂ„â€Ă‚Â¢y
          </button>}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-large"
            hidden={!isAdmin}
            style={{ marginRight: 'auto', backgroundColor: '#ef4444', color: 'white', border: 'none' }}
          >
            XĂ„â€Ă‚Â³a CĂ„â€Ă‚Â´ng ViĂ„â€Ă‚Âªn
          </button>
          <button
            type="button"
            onClick={() => navigate(`/parks/${id}`)}
            className="btn btn-ghost btn-large"
          >
            HÄ‚Â¡Ă‚Â»Ă‚Â§y
          </button>
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Ä‚â€Ă‚Âang lÄ‚â€ Ă‚Â°u...' : 'CÄ‚Â¡Ă‚ÂºĂ‚Â­p NhÄ‚Â¡Ă‚ÂºĂ‚Â­t'}
          </button>
        </div>
      </form>
    </div>
  );
}
