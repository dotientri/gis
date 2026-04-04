import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../store';
import NotFoundPage from './NotFoundPage';
import '../styles/pages/ParkFormPage.css';

export default function EventFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const [loading, setLoading] = useState(false);
  const [parks, setParks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';

  const [formData, setFormData] = useState({
    ten_su_kien: '',
    ma_cong_vien: '',
    loai_su_kien: 'van_hoa',
    thoi_gian_bat_dau: '',
    thoi_gian_ket_thuc: '',
    mo_ta: '',
    suc_chua_toi_da: '',
    mien_phi: true,
    trang_thai: 'sap_dien_ra'
  });

  // Tải danh sách công viên để làm dropdown
  useEffect(() => {
    const fetchParks = async () => {
      try {
        const res = await fetch('/api/cong-vien/?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setParks(data.results || data);
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchParks();
  }, [token]);

  // Tải dữ liệu sự kiện nếu ở chế độ sửa
  useEffect(() => {
    if (isEditMode && isAdmin) {
      setLoading(true);
      const fetchEvent = async () => {
        try {
          const res = await fetch(`/api/su-kien-cong-vien/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Không tìm thấy sự kiện');
          const data = await res.json();
          
          // Format chuỗi thời gian thành giá trị tương thích cho input type="datetime-local"
          const formatDateTime = (dtStr) => {
            if (!dtStr) return '';
            const dt = new Date(dtStr);
            const tzOffset = dt.getTimezoneOffset() * 60000;
            return new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
          };

          setFormData({
            ten_su_kien: data.ten_su_kien || '',
            ma_cong_vien: data.ma_cong_vien || '',
            loai_su_kien: data.loai_su_kien || 'van_hoa',
            thoi_gian_bat_dau: formatDateTime(data.thoi_gian_bat_dau),
            thoi_gian_ket_thuc: formatDateTime(data.thoi_gian_ket_thuc),
            mo_ta: data.mo_ta || '',
            suc_chua_toi_da: data.suc_chua_toi_da || '',
            mien_phi: data.mien_phi ?? true,
            trang_thai: data.trang_thai || 'sap_dien_ra'
          });
        } catch (e) {
          showNotification('Lỗi tải sự kiện', 'error');
          navigate('/events');
        } finally {
          setLoading(false);
        }
      };
      if (token) fetchEvent();
    }
  }, [id, isEditMode, isAdmin, token, navigate, showNotification]);

  // YÊU CẦU CỐT LÕI: Dẫn nó đến 404 nếu đang sửa mà không phải Admin!
  if (isEditMode && !isAdmin) {
    return <NotFoundPage />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/su-kien-cong-vien/${id}/` : '/api/su-kien-cong-vien/';
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const payload = { ...formData };
      if (!payload.thoi_gian_ket_thuc) delete payload.thoi_gian_ket_thuc;
      if (!payload.suc_chua_toi_da) delete payload.suc_chua_toi_da;

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || Object.values(errorData).join(', ') || 'Có lỗi xảy ra');
      }

      showNotification(isEditMode ? 'Cập nhật thành công!' : 'Tạo sự kiện thành công (Đang chờ duyệt)!', 'success');
      navigate('/events');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="spinner">Đang tải...</div>;

  return (
    <div className="park-form-page">
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { background-color: #f3f4f6 !important; color: #111827 !important; height: 100%; }
        .park-form-page { background-color: #f3f4f6 !important; min-height: 100vh; padding: 24px; }
        .sidebar, aside, nav, .left-menu, .nav-menu, .main-sidebar { background-color: #ffffff !important; border-right: 1px solid #e5e7eb !important; }
        .sidebar * { color: #111827 !important; text-shadow: none !important; }
        .sidebar .active { background-color: #e5e7eb !important; color: #000000 !important; font-weight: 700 !important; box-shadow: inset 4px 0 0 #3b82f6 !important; }
      `}</style>
      <div className="form-header">
        <h1>{isEditMode ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Sự Kiện Mới'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="park-form">
        <div className="form-section">
          <div className="form-group"><label>Tên Sự Kiện *</label><input type="text" name="ten_su_kien" value={formData.ten_su_kien} onChange={handleChange} required /></div>
          <div className="form-group"><label>Công Viên *</label><select name="ma_cong_vien" value={formData.ma_cong_vien} onChange={handleChange} required><option value="">-- Chọn công viên --</option>{parks.map(p => <option key={p.ma_cong_vien} value={p.ma_cong_vien}>{p.ten_cong_vien}</option>)}</select></div>
          <div className="form-row">
            <div className="form-group"><label>Loại Sự Kiện</label><select name="loai_su_kien" value={formData.loai_su_kien} onChange={handleChange}><option value="van_hoa">Văn hóa</option><option value="the_thao">Thể thao</option><option value="le_hoi">Lễ hội</option><option value="am_nhac">Âm nhạc</option></select></div>
            {isAdmin && isEditMode && (
              <div className="form-group"><label>Trạng Thái</label><select name="trang_thai" value={formData.trang_thai} onChange={handleChange}><option value="sap_dien_ra">Sắp diễn ra</option><option value="dang_dien_ra">Đang diễn ra</option><option value="da_ket_thuc">Đã kết thúc</option><option value="huy_bo">Hủy bỏ</option></select></div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Thời Gian Bắt Đầu *</label><input type="datetime-local" name="thoi_gian_bat_dau" value={formData.thoi_gian_bat_dau} onChange={handleChange} required /></div>
            <div className="form-group"><label>Thời Gian Kết Thúc</label><input type="datetime-local" name="thoi_gian_ket_thuc" value={formData.thoi_gian_ket_thuc} onChange={handleChange} /></div>
          </div>
          <div className="form-group"><label>Mô Tả</label><textarea name="mo_ta" value={formData.mo_ta} onChange={handleChange} rows="4"></textarea></div>
          <div className="form-row">
            <div className="form-group"><label>Sức Chứa Tối Đa (Người)</label><input type="number" name="suc_chua_toi_da" value={formData.suc_chua_toi_da} onChange={handleChange} min="1" /></div>
            <div className="form-group checkbox-group" style={{marginTop: '30px'}}><label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold'}}><input type="checkbox" name="mien_phi" checked={formData.mien_phi} onChange={handleChange} style={{width: '20px', height: '20px', marginRight: '10px'}} />Miễn phí tham gia</label></div>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/events')} className="btn btn-ghost btn-large">Hủy</button>
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Tạo Sự Kiện')}</button>
        </div>
      </form>
    </div>
  );
}