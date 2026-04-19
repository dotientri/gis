import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { parksAPI } from '../api';
import { formatArea } from '../constants';
import { useUIStore } from '../store';
import { getExcerptFromHtml } from '../utils/richText';

function getParkImageUrl(park) {
  return park.anh_dai_dien || park.hinh_anh?.[0]?.url_anh || '';
}

function getParkExcerpt(text, maxLength = 180) {
  const excerpt = getExcerptFromHtml(text, maxLength);
  if (!excerpt) {
    return 'Thông tin giới thiệu đang được cập nhật cho công viên này.';
  }
  return excerpt;
}

export default function ParkArticlesPage() {
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await parksAPI.getList({ limit: 12, ordering: '-ngay_cap_nhat' });
        setParks(response.data?.results || response.data || []);
      } catch (error) {
        showNotification('Không thể tải danh sách bài viết công viên', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showNotification]);

  const filteredParks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return parks;
    return parks.filter((park) => `${park.ten_cong_vien} ${park.quan_huyen_ten || ''}`.toLowerCase().includes(keyword));
  }, [parks, search]);

  return (
    <div className="page-shell">
      <section className="landing-hero card">
        <div className="landing-copy">
          <span className="landing-kicker">Giới thiệu hệ thống</span>
          <h1 className="landing-title">Khám phá hệ thống thông tin công viên và các không gian xanh nổi bật</h1>
          <p className="landing-description">
            Đây là cổng thông tin giúp người dân theo dõi bài viết, tra cứu bản đồ, xem danh sách công viên và cập nhật sự kiện đang diễn ra.
            Cuộn xuống để xem các bài giới thiệu nổi bật về từng công viên.
          </p>
          <div className="landing-actions">
            <Link className="btn btn-primary" to="/parks">Mở bản đồ công viên</Link>
            <Link className="btn btn-ghost" to="/parks-list">Xem danh sách công viên</Link>
          </div>
        </div>
        <div className="landing-highlight surface">
          <div className="landing-metric"><strong>Bài viết giới thiệu</strong><span>Tổng hợp thông tin, lịch sử và điểm nổi bật của từng công viên.</span></div>
          <div className="landing-metric"><strong>Bản đồ tra cứu</strong><span>Xem vị trí, mở chi tiết và chỉ đường nhanh đến công viên.</span></div>
          <div className="landing-metric"><strong>Sự kiện cộng đồng</strong><span>Theo dõi các hoạt động đang và sắp diễn ra tại các công viên.</span></div>
          <div className="landing-metric"><strong>Tương tác người dùng</strong><span>Đăng nhập để báo sự cố, quản lý hồ sơ và nhận thêm quyền theo vai trò.</span></div>
        </div>
      </section>

      <section className="page-header" style={{ marginTop: 28 }}>
        <div>
          <div className="page-title">Bài viết công viên</div>
          <p className="page-subtitle">Cuộn xuống để xem các bài viết giới thiệu và mở chi tiết từng công viên.</p>
        </div>
        <div className="landing-search">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên công viên hoặc quận huyện" />
        </div>
      </section>

      {loading ? (
        <div className="loading-container card"><div className="spinner" /></div>
      ) : filteredParks.length === 0 ? (
        <div className="empty-state card section-card"><p>Không tìm thấy bài viết phù hợp.</p></div>
      ) : (
        <section className="article-grid">
          {filteredParks.map((park) => (
            <article key={park.ma_cong_vien} className="article-card surface">
              <div className="article-card-media">
                {getParkImageUrl(park) ? (
                  <img
                    className="article-card-image"
                    src={getParkImageUrl(park)}
                    alt={park.ten_cong_vien}
                    loading="lazy"
                  />
                ) : (
                  <div className="article-card-image article-card-image-placeholder">
                    <span>Chưa có ảnh công viên</span>
                  </div>
                )}
                <div className="article-card-media-overlay" />
                <span className="badge">{park.loai_ten || 'Công viên'}</span>
              </div>
              <div className="article-card-body">
                <div className="article-card-meta">{park.quan_huyen_ten || 'Chưa rõ quận huyện'} • {formatArea(park.dien_tich_m2)}</div>
                <h2>{park.ten_cong_vien}</h2>
                <p className="article-card-excerpt">{getParkExcerpt(park.mo_ta)}</p>
                {park.loai_cay_noi_bat?.length > 0 && (
                  <div className="article-tree-summary">
                    {park.loai_cay_noi_bat.map((treeType) => (
                      <span key={`${park.ma_cong_vien}-${treeType.ten_loai}`} className="badge badge-soft">
                        {treeType.ten_loai} ({treeType.so_luong})
                      </span>
                    ))}
                  </div>
                )}
                <div className="article-card-actions">
                  <Link className="btn btn-ghost btn-sm" to={`/articles/${park.ma_cong_vien}`}>Đọc bài viết</Link>
                  <Link className="btn btn-primary btn-sm" to={`/parks/${park.ma_cong_vien}`}>Xem công viên</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
