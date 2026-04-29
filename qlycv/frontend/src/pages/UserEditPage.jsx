import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hàm lấy token từ localStorage (phụ thuộc vào cách bạn đang lưu token trong ứng dụng)
  const getToken = () => {
    const authStr = localStorage.getItem('auth-storage');
    if (authStr) {
      try {
        const authData = JSON.parse(authStr);
        return authData?.state?.token || '';
      } catch (e) { }
    }
    return localStorage.getItem('token') || '';
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getToken();
        const res = await fetch(`/api/admin/users/${id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Không thể tải dữ liệu người dùng');
        const data = await res.json();
        
        setUser(data);
        setFormData({
          ho_ten: data.ho_ten || '',
          email: data.email || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/users/${id}/`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.email ? 'Email đã tồn tại hoặc không hợp lệ' : 'Có lỗi xảy ra khi cập nhật');
      }
      
      alert('Cập nhật thông tin thành công!');
      navigate(-1); // Quay lại trang danh sách sau khi lưu
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải thông tin...</div>;
  if (error) return <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '40px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Chỉnh sửa: {user?.ten_dang_nhap}</h2>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '6px' }}>Quay lại</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>Tên đăng nhập (Chỉ đọc)</label>
          <input type="text" value={user?.ten_dang_nhap || ''} disabled style={{ width: '100%', padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', color: '#6b7280' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>Họ và tên</label>
          <input type="text" name="ho_ten" value={formData.ho_ten} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827' }} />
        </div>

        <button type="submit" style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '15px' }}>
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
}