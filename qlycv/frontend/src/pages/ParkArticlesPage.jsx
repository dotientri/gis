import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks';
import { parksAPI } from '../api';
import '../styles/pages/ParkArticlesPage.css';

export default function ParkArticlesPage() {
  const { data: responseData, loading, execute: fetchParks } = useApi(parksAPI.getList, false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchParks({ limit: 100, ordering: '-ngay_cap_nhat' });
  }, []);

  const parks = responseData?.results || [];
  
  const filteredParks = parks.filter(park => 
    park.ten_cong_vien.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="articles-page">
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

        .articles-page { background-color: #f3f4f6; min-height: 100vh; padding: 20px; }
        .page-header h1 { color: #111827 !important; font-weight: 800; }
        .page-header .subtitle { color: #6b7280 !important; }
        .search-box input { background: #ffffff !important; border: 1px solid #d1d5db !important; color: #111827 !important; }
        
        .article-card { background: #ffffff !important; border: 1px solid #e5e7eb !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important; transition: transform 0.3s ease, box-shadow 0.3s ease !important; }
        .article-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; }
        .article-title a { color: #111827 !important; text-decoration: none; }
        .article-title a:hover { color: #2563eb !important; }
        .article-content p { color: #4b5563 !important; }
        .article-meta-info span { color: #6b7280 !important; }
      `}</style>
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Khám Phá Công Viên</h1>
            <p className="subtitle">Những điểm đến xanh mát và thú vị tại TP.HCM</p>
          </div>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Tìm kiếm bài viết..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="article-search-input"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : (
        <div className="articles-grid">
          {filteredParks.map(park => (
            <article key={park.ma_cong_vien || park.id} className="article-card">
              <div className="article-image-wrapper">
                <img 
                  src={park.anh_dai_dien || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='} 
                  alt={park.ten_cong_vien} 
                  className="article-image"
                  onError={(e) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}
                />
                <span className="article-category">{park.loai_ten || 'Công viên'}</span>
              </div>
              
              <div className="article-content">
                <h2 className="article-title">
                  <Link to={`/articles/${park.ma_cong_vien || park.id}`}>
                    {park.ten_cong_vien}
                  </Link>
                </h2>
                
                <div className="article-meta-info">
                  <span>📍 {park.quan_huyen_ten}</span>
                  <span>📏 {(park.dien_tich_m2 / 10000).toFixed(2)} ha</span>
                </div>

                <p className="article-excerpt">
                  {park.mo_ta 
                    ? (park.mo_ta.length > 120 ? park.mo_ta.substring(0, 120) + '...' : park.mo_ta)
                    : 'Chưa có mô tả chi tiết cho công viên này.'}
                </p>

                <div className="article-footer">
                  <Link to={`/articles/${park.ma_cong_vien || park.id}`} className="read-more-btn">
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            </article>
          ))}
          
          {filteredParks.length === 0 && (
            <div className="no-results">
              <p>Không tìm thấy bài viết nào phù hợp.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}