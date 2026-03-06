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
                  src={park.anh_dai_dien || 'https://via.placeholder.com/400x250?text=No+Image'} 
                  alt={park.ten_cong_vien} 
                  className="article-image"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/400x250?text=Park'}
                />
                <span className="article-category">{park.loai_ten || 'Công viên'}</span>
              </div>
              
              <div className="article-content">
                <h2 className="article-title">
                  <Link to={`/parks/${park.ma_cong_vien || park.id}`}>
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
                  <Link to={`/parks/${park.ma_cong_vien || park.id}`} className="read-more-btn">
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