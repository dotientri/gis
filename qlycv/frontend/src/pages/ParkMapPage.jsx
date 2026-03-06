import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useApi } from '../hooks';
import { parksAPI } from '../api';
import { useMapStore, useFilterStore } from '../store';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import '../styles/pages/ParkMapPage.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

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

// Component điều khiển chỉ đường
const RoutingControl = ({ start, end, mode }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    // Xóa lộ trình cũ nếu có
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Tạo lộ trình mới
    // Map mode sang profile của OSRM: 'driving' (ô tô), 'cycling' (xe máy/xe đạp), 'walking' (đi bộ)
    const profile = mode === 'walking' ? 'walking' : (mode === 'bike' ? 'cycling' : 'driving');

    try {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1])
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: profile
        }),
        routeWhileDragging: false,
        lineOptions: {
          styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
        },
        show: true, // Hiển thị bảng hướng dẫn (rẽ trái, rẽ phải...)
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        createMarker: function() { return null; } // Không tạo marker mặc định (vì đã có marker của app)
      }).addTo(map);
    } catch (e) {
      console.error("Lỗi tạo routing:", e);
    }

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, start, end, mode]);

  return null;
};

export default function ParkMapPage() {
  const [searchParams] = useSearchParams();
  const { data: parks, loading, error, execute } = useApi(parksAPI.getAllForMap, false);
  const { centerLat, centerLng, zoomLevel, selectedParkId, setCenter, setZoom, setSelectedPark } = useMapStore();
  const { filters, setFilter } = useFilterStore();
  const [searchKey, setSearchKey] = useState('');
  
  // State mới cho định vị và bán kính
  const [displayedParks, setDisplayedParks] = useState([]);
  // Đổi tên thành searchLocation để rõ ràng đây là điểm tìm kiếm
  const [searchLocation, setSearchLocation] = useState(null);
  const [routingDestination, setRoutingDestination] = useState(null);
  const [transportMode, setTransportMode] = useState('driving'); // 'driving', 'bike', 'walking'
  const [radius, setRadius] = useState(5); // Mặc định 5km
  const [isSearching, setIsSearching] = useState(false);
  
  // Ref cho marker để xử lý kéo thả ổn định
  const searchMarkerRef = useRef(null);

  useEffect(() => {
    execute();
    // Tự động hiện marker tìm kiếm ở giữa bản đồ khi vào trang
    setSearchLocation([centerLat, centerLng]);
  }, []);

  // Xử lý chỉ đường từ trang khác chuyển sang (thông qua URL params)
  useEffect(() => {
    const destLat = searchParams.get('dest_lat');
    const destLng = searchParams.get('dest_lng');
    
    if (destLat && destLng) {
      // 1. Đặt điểm đến
      setRoutingDestination([parseFloat(destLat), parseFloat(destLng)]);
      
      // 2. Tự động lấy vị trí hiện tại để bắt đầu chỉ đường
      handleFindNearest();
    }
  }, [searchParams]);

  // Effect mới: Tự động gọi API khi searchLocation hoặc radius thay đổi
  useEffect(() => {
    if (searchLocation) {
      const fetchNearest = async () => {
        try {
          const response = await parksAPI.getNearestParks(searchLocation[0], searchLocation[1], radius);
          setDisplayedParks(response.data.results || response.data);
        } catch (err) {
          console.error("Lỗi tìm kiếm:", err);
        }
      };

      // Debounce 300ms để tránh gọi API liên tục khi kéo thanh radius
      const timer = setTimeout(fetchNearest, 300);
      return () => clearTimeout(timer);
    }
  }, [searchLocation, radius]);

  // Đồng bộ dữ liệu khi tải xong danh sách gốc
  useEffect(() => {
    // Chỉ hiển thị mặc định nếu chưa có vị trí tìm kiếm
    if (parks && displayedParks.length === 0 && !searchLocation) {
       setDisplayedParks(parks);
    }
  }, [parks, searchLocation]);

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
          setIsSearching(false);
          // API sẽ được gọi tự động bởi useEffect
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
      dragend: (e) => {
        const marker = e.target;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          setSearchLocation([lat, lng]); // Cập nhật vị trí mới ngay lập tức
          // API sẽ được gọi tự động bởi useEffect
        }
      },
    }),
    [] 
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
          {routingDestination && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Chế độ chỉ đường:</h4>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <button 
                  onClick={() => setTransportMode('driving')} 
                  className={`btn btn-sm ${transportMode === 'driving' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >🚗 Ô tô</button>
                <button 
                  onClick={() => setTransportMode('bike')} 
                  className={`btn btn-sm ${transportMode === 'bike' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >🛵 Xe máy</button>
                <button 
                  onClick={() => setTransportMode('walking')} 
                  className={`btn btn-sm ${transportMode === 'walking' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >🚶 Đi bộ</button>
              </div>
              <button onClick={() => setRoutingDestination(null)} className="btn btn-ghost btn-full" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                ❌ Xóa Lộ Trình
              </button>
            </div>
          )}
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
          
          {/* Hiển thị đường đi nếu có điểm đến */}
          {searchLocation && routingDestination && (
            <RoutingControl start={searchLocation} end={routingDestination} mode={transportMode} />
          )}

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
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <a href={`/parks/${park.ma_cong_vien || park.id}`} className="btn btn-sm btn-primary" style={{ flex: 1 }}>
                      Chi tiết
                    </a>
                    {searchLocation && park.toa_do_trung_tam && (
                      <button 
                        onClick={() => {
                          setRoutingDestination(park.toa_do_trung_tam);
                        }}
                        className="btn btn-sm btn-secondary"
                        style={{ flex: 1 }}
                      >
                        Chỉ đường
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
