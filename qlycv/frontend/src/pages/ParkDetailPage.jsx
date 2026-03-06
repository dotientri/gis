import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks';
import { parksAPI, ratingsAPI, amenitiesAPI } from '../api';
import { useAuthStore } from '../store';
import { formatDate } from '../constants';
import '../styles/pages/ParkDetailPage.css';

export default function ParkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: park, loading: parkLoading, error: parkError, execute: fetchPark } = useApi(parksAPI.getDetail, false);
  const { data: ratings, loading: ratingsLoading, execute: fetchRatings } = useApi(ratingsAPI.getList, false);
  const { data: amenities, loading: amenitiesLoading, execute: fetchAmenities } = useApi(amenitiesAPI.getList, false);

  useEffect(() => {
    if (id) {
      fetchPark(id); // Sửa lỗi: Truyền ID trực tiếp, không truyền object
      fetchRatings({ ma_cong_vien: id }); // Tải đánh giá
      fetchAmenities({ ma_cong_vien: id }); // Tải tiện ích
    }
  }, [id]);

  // Kiểm tra quyền quản lý công viên
  const canManageParks = user && (
    user.ten_dang_nhap === 'admin' || // Admin luôn có quyền
    ['QUAN_TRI', 'QUAN_LY_CV', 'BIEN_TAP_GIS'].includes(user.nhom_quyen_code)
  );

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công viên này?')) {
      try {
        await parksAPI.delete(id);
        navigate('/parks-list');
      } catch (err) {
        alert('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  if (parkLoading) {
    return <div className="spinner">Đang tải...</div>;
  }

  if (parkError || !park) {
    return (
      <div className="error-container">
        <div className="alert alert-error">
          {parkError || 'Không tìm thấy công viên'}
        </div>
        <Link to="/parks-list" className="btn btn-primary">
          ← Quay lại
        </Link>
      </div>
    );
  }

  // Xử lý dữ liệu phân trang cho đánh giá và tiện ích
  const ratingsList = ratings?.results || [];
  const parkRatings = ratingsList.filter(r => r.ma_cong_vien === parseInt(id)) || [];
  const avgRating = parkRatings.length > 0
    ? (parkRatings.reduce((sum, r) => sum + (r.diem || 0), 0) / parkRatings.length).toFixed(1)
    : 'N/A';

  const amenitiesList = amenities?.results || [];
  const parkAmenities = amenitiesList.filter(a => a.ma_cong_vien === parseInt(id)) || [];

  return (
    <div className="park-detail-page">
      <div className="detail-header">
        <Link to="/parks-list" className="btn btn-ghost">
          ← Quay lại
        </Link>
        {canManageParks && (
          <div className="header-actions">
            <Link to={`/parks/${id}/edit`} className="btn btn-primary">
              Chỉnh sửa
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Xóa
            </button>
          </div>
        )}
      </div>

      <div className="detail-container">
        <div className="detail-main">
          <div className="detail-card">
            <h1>{park.ten_cong_vien || park.tens}</h1>
            <div className="detail-meta">
              <div className="meta-item">
                <span className="label">Loại:</span>
                <span className="value">
                  {typeof park.ma_loai === 'object' ? park.ma_loai.ten_loai : park.ma_loai}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Quận Huyện:</span>
                <span className="value">
                  {park.quan_huyen_ten || (typeof park.ma_quan_huyen === 'object' ? park.ma_quan_huyen.ten_quan_huyen : park.ma_quan_huyen)}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Trạng Thái:</span>
                <span className={`badge badge-${typeof park.ma_trang_thai === 'object' ? park.ma_trang_thai.ten_trang_thai : park.ma_trang_thai}`}>
                  {park.trang_thai_ten || (typeof park.ma_trang_thai === 'object' ? park.ma_trang_thai.ten_trang_thai : park.ma_trang_thai)}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Đánh Giá:</span>
                <span className="value">{avgRating} / 5</span>
              </div>
            </div>

            <div className="description-section">
              <h2>Mô Tả</h2>
              <p>{park.mo_ta || 'Chưa có mô tả'}</p>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span className="label">Diện Tích:</span>
                <span className="value">{(park.dien_tich_m2 / 10000).toFixed(2)} hecta</span>
              </div>
              <div className="info-item">
                <span className="label">Số Lượng Cây Xanh:</span>
                <span className="value">{park.cay_so_luong || 0} cây</span>
              </div>
              <div className="info-item">
                <span className="label">Tọa Độ:</span>
                <span className="value">
                  {park.toa_do_trung_tam
                    ? `${park.toa_do_trung_tam[0].toFixed(4)}, ${park.toa_do_trung_tam[1].toFixed(4)}`
                    : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Ngày Tạo:</span>
                <span className="value">{formatDate(park.ngay_tao)}</span>
              </div>
              <div className="info-item">
                <span className="label">Ngày Cập Nhật:</span>
                <span className="value">{formatDate(park.ngay_cap_nhat)}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h2>Tiện Ích ({parkAmenities.length})</h2>
            {amenitiesLoading ? (
              <div className="spinner-small">Đang tải...</div>
            ) : parkAmenities.length > 0 ? (
              <div className="amenities-grid">
                {parkAmenities.map((amenity) => (
                  <div key={amenity.id} className="amenity-card">
                    <div className="amenity-name">{amenity.ten_tien_ich}</div>
                    <div className="amenity-details">
                      <p>Loại: {amenity.loai_tien_ich_ten || amenity.ma_loai_tien_ich}</p>
                      <p>Số lượng: {amenity.so_luong || 1}</p>
                      <p className={`condition condition-${amenity.tinh_trang}`}>
                        Tình trạng: {amenity.tinh_trang}
                      </p>
                      {amenity.mo_ta && <p className="amenity-note">Ghi chú: {amenity.mo_ta}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Chưa có tiện ích nào</p>
            )}
          </div>

          <div className="detail-card">
            <h2>Đánh Giá ({parkRatings.length})</h2>
            {ratingsLoading ? (
              <div className="spinner-small">Đang tải...</div>
            ) : parkRatings.length > 0 ? (
              <div className="ratings-list">
                {parkRatings.slice(0, 5).map((rating) => (
                  <div key={rating.id} className="rating-item">
                    <div className="rating-header">
                      <span className="rating-author">{rating.nguoi_danh_gia_ho_ten || 'Ẩn danh'}</span>
                      <span className="rating-score">{rating.diem}/5</span>
                    </div>
                    <p className="rating-comment">{rating.nhan_xet}</p>
                    <p className="rating-date">{formatDate(rating.ngay_danh_gia)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Chưa có đánh giá nào</p>
            )}
            <Link to={`/ratings?park=${id}`} className="btn btn-sm btn-primary">
              Xem tất cả đánh giá
            </Link>
          </div>
        </div>

        <aside className="detail-sidebar">
          <div className="sidebar-card">
            <h3>Thông Tin Nhanh</h3>
            <div className="quick-info">
              <p><strong>ID:</strong> {park.ma_cong_vien || park.id}</p>
              <p><strong>Mã:</strong> {park.ma_cong_vien}</p>
              <p><strong>Lượt xem:</strong> {park.luot_xem || 0}</p>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Hành Động</h3>
            {canManageParks && (
              <div className="action-buttons">
                <Link to={`/parks/${id}/edit`} className="btn btn-primary btn-full">
                  Chỉnh Sửa
                </Link>
                <a
                  href={`/parks?center=${park.toa_do_trung_tam?.[0]},${park.toa_do_trung_tam?.[1]}`}
                  className="btn btn-ghost btn-full"
                >
                  Xem Bản Đồ
                </a>
                <button onClick={handleDelete} className="btn btn-danger btn-full">
                  Xóa
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
