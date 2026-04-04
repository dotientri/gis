import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { parksAPI, amenitiesAPI } from '../api';
import { formatDate, MAP_CONFIG } from '../constants';
import '../styles/pages/ArticleDetailPage.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix lỗi icon mặc định của Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ArticleDetailPage() {
  const { id } = useParams();
  const { data: park, loading, error, execute: fetchPark } = useApi(parksAPI.getDetail, false);
  const { data: amenitiesData, execute: fetchAmenities } = useApi(amenitiesAPI.getList, false);

  // State cho Lightbox (Xem ảnh phóng to)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxType, setLightboxType] = useState('park'); // 'park' or 'amenity'

  // Hàm mở Lightbox
  const openLightbox = (index, type = 'park', images = null) => {
    if (type === 'park') {
      setLightboxImages(park?.hinh_anh?.map(img => img.url_anh) || []);
    } else if (type === 'amenity' && images) {
      setLightboxImages(images);
    }
    setLightboxType(type);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = (e) => {
    e?.stopPropagation();
    if (lightboxImages?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % lightboxImages.length);
    }
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    if (lightboxImages?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPark(id);
      fetchAmenities({ ma_cong_vien: id });
    }
  }, [id]);

  // Hỗ trợ phím tắt cho Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxImages]);

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (error || !park) return <div className="error-container">Không tìm thấy bài viết.</div>;

  const amenities = amenitiesData?.results || [];
  
  // Lấy ảnh bìa (ưu tiên ảnh đại diện, hoặc ảnh đầu tiên trong album)
  const coverImage = park.anh_dai_dien || (park.hinh_anh && park.hinh_anh.length > 0 ? park.hinh_anh[0].url_anh : 'https://via.placeholder.com/1200x600?text=Park+Cover');

  return (
    <div className="article-detail-page">
      {/* LIGHT THEME FORCE STYLE: Ép giao diện sáng đồng bộ */}
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

        /* LIGHTBOX STYLES */
        .gallery-item { cursor: pointer; transition: transform 0.2s; position: relative; }
        .gallery-item:hover { transform: scale(1.02); }
        .gallery-item img { display: block; width: 100%; height: auto; }
        
        .lightbox-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex; justify-content: center; align-items: center;
          z-index: 9999; backdrop-filter: blur(5px);
        }
        
        .lightbox-content {
          position: relative; max-width: 90%; max-height: 90%;
          display: flex; flex-direction: column; align-items: center;
        }
        
        .lightbox-image {
          max-width: 100%; max-height: 80vh; object-fit: contain;
          box-shadow: 0 0 20px rgba(0,0,0,0.5); border: 2px solid #333;
          border-radius: 4px;
        }
        
        .lightbox-close {
          position: absolute; top: 20px; right: 30px;
          font-size: 40px; color: #fff; background: none; border: none;
          cursor: pointer; z-index: 10001; transition: color 0.2s;
        }
        .lightbox-close:hover { color: #ef4444; }
        
        .lightbox-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background-color: rgba(255, 255, 255, 0.1); color: white;
          border: none; font-size: 24px; width: 50px; height: 50px;
          border-radius: 50%; cursor: pointer; z-index: 10001;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .lightbox-nav:hover { background-color: rgba(255, 255, 255, 0.3); transform: translateY(-50%) scale(1.1); }
        .lightbox-prev { left: 30px; }
        .lightbox-next { right: 30px; }
        
        .lightbox-caption {
          color: #e5e7eb; margin-top: 15px; font-size: 16px; font-weight: 500;
          background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 20px;
        }
        .lightbox-counter {
          position: absolute; top: 20px; left: 30px;
          color: #9ca3af; font-size: 14px; font-weight: 600;
        }
      `}</style>
      {/* Hero Section */}
      <div className="article-hero" style={{ backgroundImage: `url(${coverImage})` }}>
        <div className="article-hero-overlay">
          <div className="article-hero-content">
            <span className="article-tag">{park.loai_ten || 'Công viên'}</span>
            <h1 className="article-title">{park.ten_cong_vien}</h1>
            <div className="article-meta">
              <span>📍 {park.quan_huyen_ten}</span>
              <span>📅 Cập nhật: {formatDate(park.ngay_cap_nhat)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="article-container">
        <div className="article-main">
          {/* Giới thiệu chung */}
          <section className="article-section">
            <p className="article-lead">{park.mo_ta}</p>
          </section>

          {/* Thông tin chi tiết (Lịch sử & Đặc điểm) */}
          {park.lich_su && (
            <section className="article-section">
              <h2>Lịch sử hình thành</h2>
              <p>{park.lich_su}</p>
            </section>
          )}

          {/* Gallery Ảnh */}
          {park.hinh_anh && park.hinh_anh.length > 0 && (
            <section className="article-section">
              <h2>Thư viện ảnh</h2>
              <div className="article-gallery">
                {park.hinh_anh.map((img, idx) => (
                  <div key={img.ma_hinh_anh || idx} className="gallery-item" onClick={() => openLightbox(idx)} title="Bấm để phóng to">
                    <img src={img.url_anh} alt={`Ảnh ${idx + 1}`} />
                    {img.mo_ta && <p className="gallery-caption">{img.mo_ta}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tiện ích nổi bật */}
          {amenities.length > 0 && (
            <section className="article-section">
              <h2>Tiện ích & Dịch vụ</h2>
              <div className="amenities-showcase">
                {amenities.map((am) => (
                  <div key={am.ma_tien_ich} className="amenity-box">
                    {am.hinh_anh && am.hinh_anh.length > 0 && (
                      <img 
                        src={am.hinh_anh[0]} 
                        alt={am.loai_tien_ich_ten} 
                        className="amenity-img" 
                        onClick={() => openLightbox(0, 'amenity', am.hinh_anh)}
                        title="Bấm để xem chi tiết ảnh"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }} 
                      />
                    )}
                    <div className="amenity-info">
                      <h3>{am.loai_tien_ich_ten}</h3>
                      <p>{am.mo_ta || 'Tiện ích phục vụ cộng đồng.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar thông tin */}
        <aside className="article-sidebar">
          <div className="sidebar-widget info-widget">
            <h3>Thông tin nhanh</h3>
            <ul>
              <li>
                <strong>Địa chỉ:</strong>
                <span>{park.dia_chi}</span>
              </li>
              <li>
                <strong>Giờ mở cửa:</strong>
                <span>{park.mo_cua_24_7 ? 'Mở cửa 24/7' : `${park.gio_mo_cua || 'Sáng'} - ${park.gio_dong_cua || 'Tối'}`}</span>
              </li>
              <li>
                <strong>Vé vào cổng:</strong>
                <span>{park.mien_phi_vao_cua ? 'Miễn phí' : `${parseInt(park.gia_ve).toLocaleString()} đ`}</span>
              </li>
              <li>
                <strong>Diện tích:</strong>
                <span>{(park.dien_tich_m2 / 10000).toFixed(2)} ha</span>
              </li>
            </ul>
            <div className="sidebar-actions">
              {park.toa_do_trung_tam && (
                <Link 
                  to={`/parks?dest_lat=${park.toa_do_trung_tam[0]}&dest_lng=${park.toa_do_trung_tam[1]}`}
                  className="btn btn-primary btn-full"
                >
                  Chỉ đường ngay
                </Link>
              )}
            </div>
          </div>

          <div className="sidebar-widget map-widget">
            <h3>Vị trí</h3>
            {park.toa_do_trung_tam && Array.isArray(park.toa_do_trung_tam) && park.toa_do_trung_tam.length === 2 ? (
              <div style={{ height: '250px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <MapContainer 
                  center={park.toa_do_trung_tam} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false} // Tắt cuộn chuột để dễ đọc bài viết
                >
                  <TileLayer url={MAP_CONFIG.TILE_LAYER} attribution={MAP_CONFIG.ATTRIBUTION} />
                  <Marker position={park.toa_do_trung_tam}>
                    <Popup>{park.ten_cong_vien}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="mini-map-placeholder">Chưa có tọa độ</div>
            )}
          </div>
        </aside>
      </div>
      
      {/* LIGHTBOX MODAL */}
      {lightboxOpen && lightboxImages && lightboxImages.length > 0 && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>&times;</button>
          
          <div className="lightbox-counter">
            {currentImageIndex + 1} / {lightboxImages.length}
          </div>

          <button className="lightbox-nav lightbox-prev" onClick={prevImage}>&#10094;</button>
          
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img 
              src={lightboxImages[currentImageIndex]} 
              alt={`Ảnh chi tiết ${currentImageIndex + 1}`} 
              className="lightbox-image"
            />
            {lightboxType === 'park' && park?.hinh_anh?.[currentImageIndex]?.mo_ta && (
              <p className="lightbox-caption">{park.hinh_anh[currentImageIndex].mo_ta}</p>
            )}
            {lightboxType === 'amenity' && (
              <p className="lightbox-caption">Tiện ích - Ảnh {currentImageIndex + 1}</p>
            )}
          </div>
          
          <button className="lightbox-nav lightbox-next" onClick={nextImage}>&#10095;</button>
        </div>
      )}

      <div className="article-footer-nav">
        <Link to="/articles" className="btn btn-ghost">← Quay lại danh sách</Link>
      </div>
    </div>
  );
}