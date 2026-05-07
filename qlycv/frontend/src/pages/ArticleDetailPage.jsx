import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { amenitiesAPI, eventsAPI, parksAPI, ratingsAPI } from '../api';
import RichTextContent from '../components/RichTextContent';
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS, formatArea, formatDate, formatDateTime, formatTime, MAP_CONFIG, safeArray } from '../constants';
import { useApi } from '../hooks';
import { useAuthStore, useUIStore } from '../store';
import { getExcerptFromHtml } from '../utils/richText';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function hasImage(url) {
  return Boolean(String(url || '').trim());
}

export default function ArticleDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { data: park, loading, error, execute: fetchPark } = useApi(parksAPI.getDetail, false);
  const { data: amenitiesData, execute: fetchAmenities } = useApi(amenitiesAPI.getList, false);
  const { data: eventsData, execute: fetchEvents } = useApi(eventsAPI.getList, false);
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [ownRating, setOwnRating] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isArticleExpanded, setIsArticleExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPark(id);
    fetchAmenities({ ma_cong_vien: id, limit: 12 });
    fetchEvents({ ma_cong_vien: id, ordering: 'thoi_gian_bat_dau' });
    ratingsAPI.getList({ ma_cong_vien: id, da_duyet: true, ordering: '-ngay_tao' })
      .then((response) => setRatings(safeArray(response.data)))
      .catch(() => setRatings([]));
  }, [fetchAmenities, fetchEvents, fetchPark, id]);

  useEffect(() => {
    const loadOwnRating = async () => {
      if (!id || !user) {
        setOwnRating(null);
        return;
      }

      try {
        const response = await ratingsAPI.getList({ ma_cong_vien: id, mine: true });
        setOwnRating(safeArray(response.data)[0] || null);
      } catch {
        setOwnRating(null);
      }
    };

    loadOwnRating();
  }, [id, user]);

  const amenities = useMemo(() => amenitiesData?.results || amenitiesData || [], [amenitiesData]);
  const events = useMemo(() => eventsData?.results || eventsData || [], [eventsData]);
  const center = Array.isArray(park?.toa_do_trung_tam) ? park.toa_do_trung_tam : MAP_CONFIG.DEFAULT_CENTER;
  const heroImage = park?.anh_dai_dien || park?.hinh_anh?.[0]?.url_anh || '';
  const galleryImages = useMemo(() => {
    const images = park?.hinh_anh || [];
    if (!images.length && heroImage) {
      return [{ ma_hinh_anh: 'hero', url_anh: heroImage, mo_ta: park?.ten_cong_vien }];
    }
    return images;
  }, [heroImage, park?.hinh_anh, park?.ten_cong_vien]);
  const heroExcerpt = useMemo(
    () => getExcerptFromHtml(park?.mo_ta, 240) || 'Thong tin gioi thieu ve cong vien dang duoc cap nhat.',
    [park?.mo_ta]
  );
  const activeImage = activeImageIndex !== null ? galleryImages[activeImageIndex] : null;

  const handleStarClick = (score) => {
    if (!user) {
      showNotification('Vui long dang nhap de danh gia cong vien', 'error');
      return;
    }
    if (ownRating) return;
    setSelectedRating(score);
    setShowReviewForm(true);
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRating) {
      showNotification('Vui long chon so sao danh gia', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        ma_cong_vien: id,
        diem_tong_quat: selectedRating,
        diem_ve_sinh: selectedRating,
        diem_tien_ich: selectedRating,
        diem_an_toan: selectedRating,
        diem_tieu_can_thi: selectedRating,
        noi_dung: reviewText,
      };
      const response = await ratingsAPI.create(payload);
      setOwnRating(response.data);
      setShowReviewForm(false);
      setSelectedRating(0);
      setReviewText('');
      showNotification('Da gui danh gia. Danh gia se hien thi sau khi duoc duyet.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Khong the gui danh gia', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (activeImageIndex === null) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveImageIndex(null);
      } else if (event.key === 'ArrowRight' && galleryImages.length > 1) {
        setActiveImageIndex((current) => (current + 1) % galleryImages.length);
      } else if (event.key === 'ArrowLeft' && galleryImages.length > 1) {
        setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, galleryImages.length]);

  if (loading) {
    return <div className="page-shell"><div className="loading-container card"><div className="spinner" /></div></div>;
  }

  if (error || !park) {
    return <div className="page-shell"><div className="empty-state card section-card"><p>Khong tim thay bai viet cong vien.</p></div></div>;
  }

  return (
    <div className="page-shell">
      <section className="article-hero-surface card">
        {hasImage(heroImage) ? (
          <img className="article-hero-image" src={heroImage} alt={park.ten_cong_vien} />
        ) : (
          <div className="article-hero-image article-hero-image-placeholder">
            <span>Chưa có ảnh công viên</span>
          </div>
        )}
        <div className="article-hero-overlay" />
        <div className="article-hero-copy">
          <span className="badge">{park.loai_ten || 'Cong vien'}</span>
          <h1>{park.ten_cong_vien}</h1>
          <p>{heroExcerpt}</p>
          <div className="article-hero-actions">
            <Link className="btn btn-primary" to={`/parks/${park.ma_cong_vien}`}>Mo trang cong vien</Link>
            {park.google_maps_url && <a className="btn btn-ghost" href={park.google_maps_url} target="_blank" rel="noreferrer">Chi duong</a>}
          </div>
          <div className="article-rating-box">
            <div className="article-rating-title">
              {ownRating ? `Bạn đã đánh giá ${ownRating.diem_tong_quat}/5 sao` : 'Đánh giá bài viết công viên'}
            </div>
            <div className="article-star-row" aria-label="Chọn số sao đánh giá">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  className={`article-star-button${score <= selectedRating || score <= Number(ownRating?.diem_tong_quat || 0) ? ' active' : ''}`}
                  onClick={() => handleStarClick(score)}
                  disabled={Boolean(ownRating)}
                  aria-label={`${score} sao`}
                >
                  {score <= selectedRating || score <= Number(ownRating?.diem_tong_quat || 0) ? '★' : '☆'}
                </button>
              ))}
            </div>
            {showReviewForm && (
              <form className="article-review-form" onSubmit={handleReviewSubmit}>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Nhập nội dung đánh giá của bạn..."
                />
                <div className="article-review-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <section className="card section-card">
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Thong tin noi bat</h2>
              <p className="page-subtitle">Tong hop nhanh cho nguoi xem bai viet.</p>
            </div>
          </div>
          <div className="info-list">
            <div className="info-row"><span>Quan huyen</span><strong>{park.quan_huyen_ten || 'N/A'}</strong></div>
            <div className="info-row"><span>Dien tich</span><strong>{formatArea(park.dien_tich_m2)}</strong></div>
            <div className="info-row"><span>Dia chi</span><strong>{park.dia_chi || 'Dang cap nhat'}</strong></div>
            <div className="info-row"><span>Gio mo cua</span><strong>{park.mo_cua_24_7 ? '24/7' : `${formatTime(park.gio_mo_cua)} - ${formatTime(park.gio_dong_cua)}`}</strong></div>
            <div className="info-row"><span>Ngay cap nhat</span><strong>{formatDate(park.ngay_cap_nhat)}</strong></div>
          </div>

          {park.lich_su && (
            <div className="notice" style={{ marginTop: 20 }}>
              <strong>Lich su va boi canh</strong>
              <RichTextContent html={park.lich_su} />
            </div>
          )}
        </section>

        <section className="card section-card">
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Vi tri cong vien</h2>
              <p className="page-subtitle">Ban co the xem vi tri ngay tren ban do hoac mo chi duong bang Google Maps.</p>
            </div>
          </div>
          <div style={{ height: 360, borderRadius: 24, overflow: 'hidden' }}>
            <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer attribution={MAP_CONFIG.ATTRIBUTION} url={MAP_CONFIG.TILE_LAYER} />
              <Marker position={center}>
                <Popup>{park.ten_cong_vien}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </section>
      </div>

      <section className="card section-card article-body-card" style={{ marginTop: 24 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Noi dung bai viet</h2>
            <p className="page-subtitle">Toan bo noi dung chi tiet cua bai viet cong vien.</p>
          </div>
        </div>
        <RichTextContent
          html={park.mo_ta}
          className={`article-body-content${isArticleExpanded ? ' expanded' : ''}`}
          emptyText="Thong tin gioi thieu ve cong vien dang duoc cap nhat."
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm article-expand-toggle"
          onClick={() => setIsArticleExpanded((current) => !current)}
        >
          {isArticleExpanded ? 'Thu gon' : 'Xem them'}
        </button>
      </section>

      <section className="card section-card" style={{ marginTop: 24 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Đánh giá của người dùng</h2>
            <p className="page-subtitle">Những đánh giá đã được duyệt cho công viên này.</p>
          </div>
          <span className="badge">{ratings.length} đánh giá</span>
        </div>

        {ratings.length === 0 ? (
          <div className="empty-state"><p>Chưa có đánh giá đã duyệt nào.</p></div>
        ) : (
          <div className="grid-2">
            {ratings.map((rating) => (
              <div key={rating.ma_danh_gia} className="notice">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <strong>{rating.nguoi_dung_ten || 'Người dùng'}</strong>
                  <span className="badge">{rating.diem_tong_quat || '-'} / 5 sao</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.86rem', marginBottom: 10 }}>
                  {formatDateTime(rating.ngay_tao)}
                </div>
                <div style={{ whiteSpace: 'normal' }}>{rating.noi_dung || 'Không có nội dung đánh giá.'}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card section-card" style={{ marginTop: 24 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Hinh anh cong vien</h2>
            <p className="page-subtitle">Luot ngang de xem toan bo anh noi bat cua cong vien.</p>
          </div>
        </div>

        {galleryImages.length === 0 ? (
          <div className="empty-state"><p>Cong vien nay chua co hinh anh duoc cap nhat.</p></div>
        ) : (
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x proximity' }}>
            {galleryImages.map((image, index) => (
              <figure
                key={image.ma_hinh_anh || `${image.url_anh}-${index}`}
                className="surface"
                style={{
                  minWidth: 'min(78vw, 320px)',
                  margin: 0,
                  borderRadius: 24,
                  overflow: 'hidden',
                  scrollSnapAlign: 'start',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'zoom-in',
                  }}
                >
                  <div className="article-gallery-image-shell">
                    {hasImage(image.url_anh) ? (
                      <img
                        className="article-gallery-image"
                        src={image.url_anh}
                        alt={image.mo_ta || park.ten_cong_vien}
                      />
                    ) : (
                      <div className="article-gallery-image article-gallery-image-placeholder">
                        <span>Chưa có ảnh</span>
                      </div>
                    )}
                    <div className="article-gallery-image-overlay" />
                  </div>
                </button>
                <figcaption style={{ padding: 14, color: 'var(--text-secondary)' }}>
                  {image.mo_ta || `Hinh anh cong vien ${park.ten_cong_vien}`}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="card section-card" style={{ marginTop: 24 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Tien ich noi bat</h2>
            <p className="page-subtitle">Danh sach tien ich dang duoc cong khai de moi nguoi cung theo doi.</p>
          </div>
        </div>

        {amenities.length === 0 ? (
          <div className="empty-state"><p>Cong vien nay chua co tien ich duoc hien thi.</p></div>
        ) : (
          <div className="article-grid">
            {amenities.map((amenity) => (
              <div key={amenity.ma_tien_ich} className="article-card surface">
                <div className="article-card-body">
                  <div className="article-card-meta">{amenity.loai_tien_ich_ten || 'Tien ich'}</div>
                  <h3 style={{ margin: '4px 0 10px' }}>{amenity.ten_tien_ich || amenity.loai_tien_ich_ten}</h3>
                  <p>{amenity.mo_ta || 'Thong tin tien ich dang duoc cap nhat.'}</p>
                  <div className="info-list" style={{ marginTop: 12 }}>
                    <div className="info-row"><span>So luong</span><strong>{amenity.so_luong ?? 0}</strong></div>
                    <div className="info-row"><span>Tinh trang</span><strong>{amenity.tinh_trang || 'Chua cap nhat'}</strong></div>
                    <div className="info-row"><span>Van hanh</span><strong>{amenity.dang_su_dung ? 'Dang su dung' : 'Tam ngung'}</strong></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card section-card" style={{ marginTop: 24 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Su kien tai cong vien</h2>
            <p className="page-subtitle">Danh sach su kien cua cong vien nay se cap nhat ngay khi co su kien moi.</p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty-state"><p>Cong vien nay chua co su kien nao.</p></div>
        ) : (
          <div className="article-grid">
            {events.map((event) => (
              <div key={event.ma_su_kien} className="article-card surface">
                <div className="article-card-body">
                  <div className="article-card-meta">{EVENT_TYPE_LABELS[event.loai_su_kien] || event.loai_su_kien}</div>
                  <h3 style={{ margin: '4px 0 10px' }}>{event.ten_su_kien}</h3>
                  <p>{event.mo_ta || 'Thong tin su kien dang duoc cap nhat.'}</p>
                  <div className="info-list" style={{ marginTop: 12 }}>
                    <div className="info-row"><span>Bat dau</span><strong>{formatDateTime(event.thoi_gian_bat_dau)}</strong></div>
                    <div className="info-row"><span>Trang thai</span><strong>{EVENT_STATUS_LABELS[event.trang_thai] || event.trang_thai}</strong></div>
                    <div className="info-row"><span>Phe duyet</span><strong>{event.da_duyet ? 'Da duyet' : 'Cho duyet'}</strong></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveImageIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.84)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            className="surface"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1120px, 100%)',
              maxHeight: '92vh',
              borderRadius: 28,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: galleryImages.length > 1 ? '72px minmax(0, 1fr) 72px' : 'minmax(0, 1fr)',
              alignItems: 'center',
              background: '#0f172a',
            }}
          >
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)}
                style={{
                  height: '100%',
                  border: 'none',
                  background: 'rgba(15, 23, 42, 0.2)',
                  color: '#fff',
                  fontSize: 30,
                  cursor: 'pointer',
                }}
              >
                ‹
              </button>
            )}

            <div style={{ display: 'grid', gap: 12, padding: 12 }}>
              <img
                src={activeImage.url_anh}
                alt={activeImage.mo_ta || park.ten_cong_vien}
                style={{
                  width: '100%',
                  maxHeight: '78vh',
                  objectFit: 'contain',
                  borderRadius: 20,
                  background: 'rgba(15, 23, 42, 0.35)',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', color: '#e2e8f0' }}>
                <div>{activeImage.mo_ta || `Hinh anh cong vien ${park.ten_cong_vien}`}</div>
                <div style={{ whiteSpace: 'nowrap' }}>{activeImageIndex + 1} / {galleryImages.length}</div>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIndex((current) => (current + 1) % galleryImages.length)}
                style={{
                  height: '100%',
                  border: 'none',
                  background: 'rgba(15, 23, 42, 0.2)',
                  color: '#fff',
                  fontSize: 30,
                  cursor: 'pointer',
                }}
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
