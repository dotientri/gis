import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '../hooks';
import { adminAPI } from '../api';
import { useUIStore, useAuthStore } from '../store';
import '../styles/pages/ParkFormPage.css'; // Re-use form styles

export default function AdminUserFormPage() {
  const { id } = useParams(); // If id exists, it's Edit mode
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const { token } = useAuthStore(); // Lấy token chuẩn xác từ Zustand Store
  const [loading, setLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]); // Lưu danh sách nhóm quyền từ Backend

  const isEditMode = !!id;

  const { values, setValues, handleChange, handleSubmit, isSubmitting } = useForm(
    {
      ten_dang_nhap: '',
      email: '',
      ho_ten: '',
      password: '', // Only for create
      ma_nhom_quyen: '',
      dang_hoat_dong: true
    },
    async (formData) => {
      try {
        // Prepare data
        const payload = {
          ...formData,
        };
        
        if (isEditMode) {
            delete payload.password; // Don't update password via this form for now
            delete payload.ten_dang_nhap; // Prevent username change
            
            // FIX: Sử dụng fetch với method PATCH thay vì PUT của adminAPI
            // PATCH cho phép cập nhật một phần dữ liệu, tránh lỗi 400 do thiếu ten_dang_nhap
            const res = await fetch(`/api/admin/users/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw { response: { data: errorData } }; // Bắn lỗi để catch block phía dưới bắt được
            }
            showNotification('Cập nhật người dùng thành công!', 'success');
        } else {
            if (!payload.password) {
                showNotification('Mật khẩu là bắt buộc khi tạo người dùng mới.', 'error');
                return;
            }
            
            // FIX: Sử dụng fetch chuẩn để tạo mới, đính kèm token chính xác
            const res = await fetch('/api/admin/users/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw { response: { data: errorData } };
            }
            showNotification('Thêm người dùng mới thành công!', 'success');
        }
        
        navigate('/admin/users');
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.detail || err.response?.data?.error || Object.values(err.response?.data || {}).join(', ') || 'Đã có lỗi xảy ra';
        showNotification(msg, 'error');
      }
    }
  );

  // Tự động lấy danh sách vai trò thực tế (kèm ID) từ Backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/nhom-quyen/', {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const roles = data.results || data;
        setRoleOptions(roles);
        
        // Mặc định chọn Người dùng cộng đồng nếu là Tạo Mới
        if (!isEditMode && roles.length > 0 && !values.ma_nhom_quyen) {
            const defaultRole = roles.find(r => r.ten_nhom === 'CONG_DONG') || roles[0];
            setValues(prev => ({ ...prev, ma_nhom_quyen: defaultRole.ma_nhom_quyen }));
        }
      } catch (e) {
        console.error("Lỗi lấy danh sách vai trò:", e);
      }
    };
    if (token) fetchRoles();
  }, [token, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      const fetchDetail = async () => {
        try {
            // Sử dụng endpoint chuẩn của Admin qua proxy
            const res = await fetch(`/api/admin/users/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch user');
            const user = await res.json();
            
            setValues({
                ten_dang_nhap: user.ten_dang_nhap,
                email: user.email,
                ho_ten: user.ho_ten || '',
                ma_nhom_quyen: user.ma_nhom_quyen || '', // ma_nhom_quyen trả về ID là chuẩn nhất
                dang_hoat_dong: user.dang_hoat_dong
            });
        } catch (e) {
            showNotification('Không tìm thấy thông tin người dùng', 'error');
            navigate('/admin/users');
        } finally {
            setLoading(false);
        }
      };
      if (token) fetchDetail();
    }
  // FIX MẠNH: Bỏ setValues, navigate, showNotification khỏi dependency array
  // để tránh lỗi re-render vòng lặp khiến form tự động reset lại giá trị cũ khi người dùng vừa chọn.
  }, [id, token, isEditMode]);

  if (loading) return <div className="spinner">Đang tải...</div>;

  return (
    <div className="park-form-page">
      {/* LIGHT THEME FORCE STYLE */}
      <style>{`
        :root { color-scheme: light; }
        html, body, #root, .app-container { background-color: #f3f4f6 !important; color: #111827 !important; height: 100%; }
        .park-form-page { background-color: #f3f4f6 !important; min-height: 100vh; padding: 24px; }
      `}</style>

      <div className="form-header">
        <h1>{isEditMode ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h1>
        <p>Quản lý thông tin và phân quyền tài khoản</p>
      </div>

      <form onSubmit={handleSubmit} className="park-form">
        <div className="form-section">
          <div className="form-group">
            <label>Tên Đăng Nhập *</label>
            <input 
                type="text" 
                name="ten_dang_nhap" 
                value={values.ten_dang_nhap} 
                onChange={handleChange} 
                required 
                disabled={isEditMode} // Không cho sửa username
                placeholder="vd: nguyenvanan"
            />
          </div>

          {!isEditMode && (
            <div className="form-group">
                <label>Mật Khẩu *</label>
                <input 
                    type="password" 
                    name="password" 
                    value={values.password} 
                    onChange={handleChange} 
                    required 
                    placeholder="••••••••"
                />
            </div>
          )}

          <div className="form-group">
            <label>Email *</label>
            <input 
                type="email" 
                name="email" 
                value={values.email} 
                onChange={handleChange} 
                required 
                placeholder="vd: an@example.com"
            />
          </div>

          <div className="form-group">
            <label>Họ và Tên</label>
            <input 
                type="text" 
                name="ho_ten" 
                value={values.ho_ten} 
                onChange={handleChange} 
                placeholder="vd: Nguyễn Văn An"
            />
          </div>

          <div className="form-group">
            <label>Phân Quyền (Vai Trò) *</label>
            <select name="ma_nhom_quyen" value={values.ma_nhom_quyen} onChange={handleChange} required>
                <option value="">-- Chọn vai trò --</option>
                {roleOptions.map(role => (
                    <option key={role.ma_nhom_quyen} value={role.ma_nhom_quyen}>{role.mo_ta || role.ten_nhom}</option>
                ))}
            </select>
          </div>

          <div className="form-group checkbox-group" style={{marginTop: '10px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input
                type="checkbox"
                name="dang_hoat_dong"
                checked={values.dang_hoat_dong}
                onChange={handleChange}
                style={{width: '20px', height: '20px', marginRight: '10px'}}
              />
              Đang hoạt động (Active)
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin/users')} className="btn btn-ghost btn-large">Hủy</button>
          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật' : 'Tạo Người Dùng')}
          </button>
        </div>
      </form>
    </div>
  );
}