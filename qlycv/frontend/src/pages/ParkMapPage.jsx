import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useApi } from '../hooks';
import { parksAPI } from '../api';
import { useMapStore, useFilterStore } from '../store';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import '../styles/pages/ParkMapPage.css';

// Custom hook to handle map state
function MapController() {
  const map = useMap();
  const { centerLat, centerLng, zoomLevel } = useMapStore();

  useEffect(() => {
    map.setView([centerLat, centerLng], zoomLevel);
  }, [centerLat, centerLng, zoomLevel, map]);

  return null;
}

// Icon cho vị trí người dùng (Chấm tròn xanh)
const userIcon = L.divIcon({
  className: 'user-location-marker', // Class riêng để tránh style mặc định
  html: `<div style="
    background-color: #3b82f6; 
    width: 20px; 
    height: 20px; 
    border-radius: 50%; 
    border: 3px solid white; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

export default function ParkMapPage() {
  const { data: parks, loading, error, execute } = useApi(parksAPI.getAllForMap, false);
  const { centerLat, centerLng, zoomLevel, selectedParkId, setCenter, setZoom, setSelectedPark } = useMapStore();
  const { filters, setFilter } = useFilterStore();
  const [searchKey, setSearchKey] = useState('');
  
  // State mới cho định vị và bán kính
  const [displayedParks, setDisplayedParks] = useState([]);
  // Đổi tên thành searchLocation để rõ ràng đây là điểm tìm kiếm
  const [searchLocation, setSearchLocation] = useState(null);
  const [radius, setRadius] = useState(5); // Mặc định 5km
  const [isSearching, setIsSearching] = useState(false);
  
  // Ref cho marker để xử lý kéo thả ổn định
  const searchMarkerRef = useRef(null);

  useEffect(() => {
    execute();
    // Tự động hiện marker tìm kiếm ở giữa bản đồ khi vào trang
    setSearchLocation([centerLat, centerLng]);
  }, []);

  // Đồng bộ dữ liệu khi tải xong danh sách gốc
  useEffect(() => {
    // Chỉ cập nhật danh sách hiển thị nếu chưa có kết quả tìm kiếm riêng
    if (parks && displayedParks.length === 0) {
      setDisplayedParks(parks);
    }
    // Nếu parks thay đổi (ví dụ reload), cập nhật lại
    if (parks && !searchLocation) {
       setDisplayedParks(parks);
    }
  }, [parks]);

  const handleMarkerClick = (park) => {
    setSelectedPark(park.id);
    setCenter(park.toa_do_trung_tam?.[0] || DEFAULT_CENTER[0], park.toa_do_trung_tam?.[1] || DEFAULT_CENTER[1]);
    setZoom(14);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKey.trim()) {
      setFilter('search', searchKey);
    }
  };

  const handleFindNearest = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setSearchLocation([latitude, longitude]);
          setCenter(latitude, longitude);
          setZoom(15); // Zoom gần hơn để thấy rõ vị trí
          
          try {
            // Gọi API tìm kiếm theo bán kính
            const response = await parksAPI.getNearestParks(latitude, longitude, radius);
            const parks = response.data.results || response.data;
            setDisplayedParks(parks);
            
            // Debug log để xem dữ liệu trả về
            console.log('Nearest parks found:', {
              count: response.data.count,
              radius_km: response.data.radius_km,
              parks_count: parks.length
            });
          } catch (err) {
            console.error('Error finding nearest parks:', err);
            alert('Lỗi khi tìm công viên gần nhất: ' + (err.response?.data?.error || err.message));
          } finally {
            setIsSearching(false);
          }
        },
        (error) => {
          setIsSearching(false);
          console.error('Geolocation error:', error);
          alert('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí trên trình duyệt.');
        },
        { enableHighAccuracy: true, timeout: 10000 } // Thêm tùy chọn độ chính xác cao
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị');
    }
  };

  const handleResetMap = () => {
    setDisplayedParks(parks || []);
    // Không reset searchLocation để giữ marker, chỉ reset danh sách
    setSearchLocation([DEFAULT_CENTER[0], DEFAULT_CENTER[1]]);
    setCenter(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
  };

  const filteredParks = displayedParks?.filter((park) => {
    const parkName = park.ten_cong_vien || park.tens || '';
    if (filters.search && !parkName.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.maLoai && park.ma_loai !== filters.maLoai) {
      return false;
    }
    if (filters.maTrangThai && park.ma_trang_thai !== filters.maTrangThai) {
      return false;
    }
    return true;
  }) || [];

  // Fix Leaflet icon issue
  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const selectedIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [32, 51],
    iconAnchor: [16, 51],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Xử lý sự kiện kéo thả marker tìm kiếm
  const searchMarkerHandlers = useMemo(
    () => ({
      dragend: async (e) => {
        const marker = e.target;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          setSearchLocation([lat, lng]); // Cập nhật vị trí mới ngay lập tức
          
          // Tự động tìm lại công viên quanh vị trí mới
          try {
            const response = await parksAPI.getNearestParks(lat, lng, radius);
            setDisplayedParks(response.data.results || response.data);
          } catch (err) {
            console.error(err);
          }
        }
      },
    }),
    [radius] // Re-create handler khi radius thay đổi
  );

  return (
    <div className="park-map-page" style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Sidebar điều khiển bên trái - Thêm style nền trắng để sửa lỗi màu đen */}
      <div className="map-controls" style={{ 
        width: '350px', 
        backgroundColor: '#ffffff', 
        borderRight: '1px solid #e5e7eb', 
        display: 'flex', 
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '16px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
        zIndex: 500
      }}>
        <div className="control-section" style={{ marginBottom: '20px' }}>
          <h3>Tìm Kiếm</h3>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Nhập tên công viên..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Tìm
            </button>
          </form>
        </div>

        <div className="control-section" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
              Bán kính tìm kiếm: {radius} km
            </label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={radius} 
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <button onClick={handleFindNearest} className="btn btn-secondary btn-full" disabled={isSearching}>
            {isSearching ? 'Đang tìm...' : 'Tìm Quanh Vị Trí Này'}
          </button>
          <button onClick={handleResetMap} className="btn btn-ghost btn-full" style={{ marginTop: '8px' }}>
            Đặt Lại Bản Đồ
          </button>
        </div>

        <div className="park-list" style={{ flex: 1, overflowY: 'auto' }}>
          <h3>Danh Sách ({filteredParks.length})</h3>
          <div className="park-items">
            {loading ? (
              <div className="spinner-small">Đang tải...</div>
            ) : filteredParks.length > 0 ? (
              filteredParks.map((park) => (
                <div
                  key={park.ma_cong_vien || park.id}
                  className={`park-item ${selectedParkId === (park.ma_cong_vien || park.id) ? 'selected' : ''}`}
                  onClick={() => handleMarkerClick(park)}
                >
                  <p className="park-name">{park.ten_cong_vien || park.tens}</p>
                  <p className="park-info">{(park.dien_tich_m2 / 10000).toFixed(2)} hecta</p>
                </div>
              ))
            ) : (
              <p className="no-results">Không tìm thấy công viên</p>
            )}
          </div>
        </div>
      </div>

      <div className="map-container" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <MapContainer center={[centerLat, centerLng]} zoom={zoomLevel} className="map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapController />
          
          {/* Hiển thị vị trí người dùng và vòng tròn bán kính */}
          {searchLocation && (
            <>
              <Marker 
                position={searchLocation} 
                icon={userIcon}
                draggable={true}
                ref={searchMarkerRef}
                eventHandlers={searchMarkerHandlers}
                zIndexOffset={1000} // Luôn hiện trên cùng
              >
                <Popup>Vị trí tìm kiếm<br/>(Kéo thả để thay đổi)</Popup>
              </Marker>
              <Circle center={searchLocation} radius={radius * 1000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
            </>
          )}

          {filteredParks.map((park) => (
            <Marker
              key={park.ma_cong_vien || park.id}
              position={park.toa_do_trung_tam || DEFAULT_CENTER}
              icon={selectedParkId === (park.ma_cong_vien || park.id) ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => handleMarkerClick(park),
              }}
            >
              <Popup>
                <div className="popup-content">
                  <h4>{park.ten_cong_vien || park.tens}</h4>
                  <p>Diện tích: {(park.dien_tich_m2 / 10000).toFixed(2)} hecta</p>
                  <a href={`/parks/${park.ma_cong_vien || park.id}`} className="btn btn-sm btn-primary">
                    Chi tiết
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
