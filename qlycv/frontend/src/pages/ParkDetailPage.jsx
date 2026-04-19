import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { amenitiesAPI, parksAPI, ratingsAPI } from '../api';
import { formatArea, formatDateTime, formatRating, formatTime, getStatusColor, safeArray } from '../constants';
import RichTextContent from '../components/RichTextContent';
import { useAuthStore, useUIStore } from '../store';

export default function ParkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [park, setPark] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';
  const isManagerOwnPark = user?.nhom_quyen_code === 'QUAN_LY' && String(user?.ma_cong_vien) === String(id);
  const canEditPark = isAdmin || isManagerOwnPark;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [parkResponse, ratingsResponse, amenitiesResponse] = await Promise.all([
          parksAPI.getDetail(id),
          ratingsAPI.getList({ ma_cong_vien: id }),
          amenitiesAPI.getList({ ma_cong_vien: id }),
        ]);
        setPark(parkResponse.data);
        setRatings(safeArray(ratingsResponse.data));
        setAmenities(safeArray(amenitiesResponse.data));
      } catch (error) {
        showNotification('Không thể tải chi tiết công viên', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, showNotification]);

  const reviewStats = useMemo(() => ({
    total: ratings.length,
    approved: ratings.filter((item) => item.da_duyet).length,
  }), [ratings]);

  const handleDelete = async () => {
    if (!window.confirm('Xóa công viên này?')) return;
    try {
      await parksAPI.delete(id);
      showNotification('Đã xóa công viên', 'success');
      navigate('/parks-list');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Không thể xóa công viên', 'error');
    }
  };

  if (loading) {
    return <div className="page-shell"><div className="card loading-container"><div className="spinner" /></div></div>;
  }

  if (!park) {
    return <div className="page-shell"><div className="card empty-state"><p>Không tìm thấy công viên.</p></div></div>;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">{park.ten_cong_vien}</div>
          <p className="page-subtitle">{park.dia_chi || 'Chưa cập nhật địa chỉ chi tiết'} • {park.quan_huyen_ten || 'N/A'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-ghost" to="/parks-list">Quay lại</Link>
          {park.google_maps_url && <a className="btn btn-primary" href={park.google_maps_url} target="_blank" rel="noreferrer">Chỉ đường</a>}
          {canEditPark && <Link className="btn btn-primary" to={`/parks/${id}/edit`}>Chỉnh sửa</Link>}
          {isAdmin && <button type="button" className="btn btn-danger" onClick={handleDelete}>Xóa</button>}
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-label">Trạng thái</div><div className="stat-value" style={{ fontSize: '1.7rem' }}>{park.trang_thai_ten || 'N/A'}</div><div className="stat-meta"><span className="badge"><span className="badge-dot" style={{ backgroundColor: getStatusColor(park.trang_thai_ten, 'park') }} />Mã công viên {park.ma_cong_vien}</span></div></div>
        <div className="card stat-card"><div className="stat-label">Diện tích</div><div className="stat-value">{formatArea(park.dien_tich_m2)}</div><div className="stat-meta">{park.cay_so_luong || 0} cây xanh • {park.tien_ich_so_luong || 0} tiện ích</div></div>
        <div className="card stat-card"><div className="stat-label">Đánh giá</div><div className="stat-value">{formatRating(park.diem_trung_binh)}</div><div className="stat-meta">{park.so_luot_danh_gia || 0} lượt • {reviewStats.approved}/{reviewStats.total} đã duyệt</div></div>
      </div>

      <div className="grid-2">
        <section className="card section-card">
          <h2 style={{ marginTop: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Tổng quan</h2>
          <div className="info-list">
            <div className="info-row"><span>Loại công viên</span><strong>{park.loai_ten || 'N/A'}</strong></div>
            <div className="info-row"><span>Quận huyện</span><strong>{park.quan_huyen_ten || 'N/A'}</strong></div>
            <div className="info-row"><span>Đơn vị quản lý</span><strong>{park.don_vi_quan_ly || 'N/A'}</strong></div>
            <div className="info-row"><span>Trạng thái vận hành</span><strong>{park.trang_thai_van_hanh_label || 'Chưa rõ'}</strong></div>
            <div className="info-row"><span>Giờ mở cửa</span><strong>{park.mo_cua_24_7 ? '24/7' : `${formatTime(park.gio_mo_cua)} - ${formatTime(park.gio_dong_cua)}`}</strong></div>
            <div className="info-row"><span>Phí vào cổng</span><strong>{park.mien_phi_vao_cua ? 'Miễn phí' : `${park.gia_ve || 0} VND`}</strong></div>
            <div className="info-row"><span>Cập nhật lần cuối</span><strong>{formatDateTime(park.ngay_cap_nhat)}</strong></div>
          </div>
          <div className="notice" style={{ marginTop: 18 }}>
            <RichTextContent html={park.mo_ta} emptyText="Chưa có mô tả cho công viên này." />
          </div>
          {park.loai_cay_noi_bat?.length > 0 && (
            <div className="notice" style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Loại cây có trong công viên</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {park.loai_cay_noi_bat.map((treeType) => (
                  <span key={`${park.ma_cong_vien}-${treeType.ten_loai}`} className="badge">
                    {treeType.ten_loai} ({treeType.so_luong})
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card section-card">
          <h2 style={{ marginTop: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Tiện ích trong công viên</h2>
          <div className="info-list">
            {amenities.length > 0 ? amenities.map((item) => (
              <div key={item.ma_tien_ich} className="notice">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{item.loai_tien_ich_ten}</strong>
                  <span className="badge">SL {item.so_luong}</span>
                </div>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>{item.tinh_trang} • {item.dang_su_dung ? 'Đang sử dụng' : 'Tạm ngưng'}</div>
                {item.mo_ta && <div style={{ marginTop: 8 }}>{item.mo_ta}</div>}
              </div>
            )) : <div className="empty-state"><p>Chưa có tiện ích được cập nhật.</p></div>}
          </div>
        </section>
      </div>

      <section className="card section-card" style={{ marginTop: 24 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Đánh giá cộng đồng</h2>
            <p className="page-subtitle">Tổng hợp phản hồi để theo dõi chất lượng công viên.</p>
          </div>
        </div>
        <div className="grid-2">
          {ratings.length > 0 ? ratings.slice(0, 6).map((rating) => (
            <div key={rating.ma_danh_gia} className="notice">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{rating.nguoi_dung_ten || 'Người dùng cộng đồng'}</strong>
                <span className="badge">{rating.diem_tong_quat || '-'} / 5</span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: 6 }}>{formatDateTime(rating.ngay_tao)}</div>
              <div style={{ marginTop: 10 }}>{rating.noi_dung || 'Không có nội dung chi tiết.'}</div>
            </div>
          )) : <div className="empty-state"><p>Chưa có đánh giá nào.</p></div>}
        </div>
      </section>
    </div>
  );
}
