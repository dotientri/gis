import { useEffect, useState, useRef, useMemo, Fragment } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { useApi } from '../hooks';
import { parksAPI } from '../api';
import { useMapStore, useFilterStore } from '../store';
import { MAP_CONFIG } from '../constants';
import '../styles/pages/ParkMapPage.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

function MapController() {
  const map = useMap();
  const { centerLat, centerLng, zoomLevel } = useMapStore();

  useEffect(() => {
    if (map) {
      const lat = centerLat || 10.8231;
      const lng = centerLng || 106.6797;
      const zoom = zoomLevel || 10;
      console.log('Setting map view:', lat, lng, zoom);
      
      try {
        map.setView([lat, lng], zoom, { animate: true, duration: 0.5 });
      } catch (e) {
        console.error('Error setting map view:', e);
      }
    }
  }, [centerLat, centerLng, zoomLevel, map]);

  return null;
}

const userIcon = L.divIcon({
  className: 'user-location-marker',
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

const RoutingControl = ({ start, end, mode, onRoutingStart, onRoutingEnd, onRoutingError }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  
  const callbacksRef = useRef({ onRoutingStart, onRoutingEnd, onRoutingError });

  useEffect(() => {
    callbacksRef.current = { onRoutingStart, onRoutingEnd, onRoutingError };
  }, [onRoutingStart, onRoutingEnd, onRoutingError]);

  useEffect(() => {
    if (!map) return;

    if (!routingControlRef.current) {
      const control = L.Routing.control({
        waypoints: [],
        
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
          useHints: false
        }),

        show: true,
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        createMarker: () => null,
        lineOptions: {
          styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
        },
      });

      control.on('routingstart', (e) => callbacksRef.current.onRoutingStart && callbacksRef.current.onRoutingStart(e));
      control.on('routesfound', (e) => callbacksRef.current.onRoutingEnd && callbacksRef.current.onRoutingEnd(e));
      control.on('routingerror', (e) => callbacksRef.current.onRoutingError && callbacksRef.current.onRoutingError(e));

      control.addTo(map);
      routingControlRef.current = control;
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
        }
        routingControlRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (routingControlRef.current) {
      const control = routingControlRef.current;
      if (start && end) {
        const profile = mode === 'walking' ? 'walking' : (mode === 'bike' ? 'cycling' : 'driving');
        
        if (control.getRouter() && control.getRouter().options) {
            control.getRouter().options.profile = profile;
        }
        
        control.setWaypoints([
          L.latLng(start[0], start[1]).wrap(),
          L.latLng(end[0], end[1]).wrap(),
        ]);
      } else {
        control.setWaypoints([]);
      }
    }
  }, [start, end, mode]);

  return null;
};

// Status color mapping
const getStatusColor = (trangThaiTen) => {
  const status = trangThaiTen?.toLowerCase() || '';
  if (status === 'hoat_dong') return '#22c55e'; // Green
  if (['cai_tao', 'dang_xay_dung', 'tam_dong'].includes(status)) return '#eab308'; // Yellow
  return '#ef4444'; // Red (closed/inactive)
};

const getIconForStatus = (trangThaiTen, isSelected = false) => {
  const color = getStatusColor(trangThaiTen);
  const size = isSelected ? 16 : 12;
  const borderSize = isSelected ? 4 : 3;
  
  return L.divIcon({
    className: 'park-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${borderSize}px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      cursor: pointer;
    "></div>`,
    iconSize: [size + borderSize * 2, size + borderSize * 2],
    iconAnchor: [(size + borderSize * 2) / 2, (size + borderSize * 2) / 2],
    popupAnchor: [0, -(size + borderSize * 2) / 2 - 5]
  });
};

const BASE_MAP_LAYERS = {
  carto: {
    label: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>, &copy; OpenStreetMap contributors',
  },
  toner: {
    label: 'Stamen Toner',
    url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://stamen.com">Stamen Design</a>, &copy; OpenStreetMap contributors',
  },
  watercolor: {
    label: 'Stamen Watercolor',
    url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    attribution: '&copy; <a href="https://stamen.com">Stamen Design</a>, &copy; OpenStreetMap contributors',
  },
};

export default function ParkMapPage() {
  const [searchParams] = useSearchParams();
  const { data: parks, loading, error, execute } = useApi(parksAPI.getAllForMap, false);
  const { centerLat, centerLng, zoomLevel, selectedParkId, setCenter, setZoom, setSelectedPark } = useMapStore();
  const { filters, setFilter } = useFilterStore();
  const [searchKey, setSearchKey] = useState('');
  
  const [displayedParks, setDisplayedParks] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(null);
  const [routingDestination, setRoutingDestination] = useState(null);
  const [transportMode, setTransportMode] = useState('driving');
  const [mapStyle, setMapStyle] = useState('carto');
  const [radius, setRadius] = useState(5);
  const [isRouting, setIsRouting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);  // Force trigger for search
  
  const searchMarkerRef = useRef(null);

  useEffect(() => {
    execute();
    // Initialize with default Ho Chi Minh City coordinates if centerLat/centerLng not set
    const initLat = centerLat || 10.8231;
    const initLng = centerLng || 106.6797;
    // Set search location but don't mark as user-initiated yet
    setSearchLocation([initLat, initLng]);
  }, [execute, centerLat, centerLng]);

  useEffect(() => {
    const destLat = searchParams.get('dest_lat');
    const destLng = searchParams.get('dest_lng');
    
    if (destLat && destLng) {
      setRoutingDestination([parseFloat(destLat), parseFloat(destLng)]);
      setSearchLocation([parseFloat(destLat), parseFloat(destLng)]);
      setSearchRadius(radius);
    }
  }, [searchParams, radius]);

  // When user clicks Find, fetch parks within radius
  useEffect(() => {
    if (searchLocation && searchRadius !== null && searchRadius > 0) {
      const fetchNearest = async () => {
        try {
          console.log('🔍 Fetching parks near:', searchLocation, 'radius:', searchRadius, 'km');
          const response = await parksAPI.getNearestParks(searchLocation[0], searchLocation[1], searchRadius);
          console.log('✅ API Response:', response.data);
          const fetchedParks = (response.data && response.data.results) ? response.data.results : [];
          console.log(`Found: ${fetchedParks.length} parks in ${searchRadius}km`);
          setDisplayedParks(fetchedParks);
        } catch (err) {
          console.error("❌ Search error:", err.message);
          setDisplayedParks([]);
        }
      };

      fetchNearest();
    }
  }, [searchLocation, searchRadius, searchTrigger]);

  // When page first loads or searchRadius is cleared, show all parks
  useEffect(() => {
    if ((searchRadius === null || searchRadius === 0) && parks && parks.length > 0 && searchTrigger === 0) {
      console.log('📍 Showing all parks on initial load:', parks.length);
      setDisplayedParks(parks);
    }
  }, [parks, searchRadius, searchTrigger]);

  const handleMapMarkerClick = (park) => {
    setSelectedPark(park.ma_cong_vien || park.id);
  };

  const handleSidebarClick = (park) => {
    setSelectedPark(park.ma_cong_vien || park.id);
    if (park.toa_do_trung_tam && Array.isArray(park.toa_do_trung_tam) && park.toa_do_trung_tam.length === 2) {
      setCenter(park.toa_do_trung_tam[0], park.toa_do_trung_tam[1]);
      setZoom(16);
    }
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
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Got position:', latitude, longitude);
          setSearchLocation([latitude, longitude]);
          setSearchRadius(radius);
          setCenter(latitude, longitude);
          setZoom(15);
          setIsSearching(false);
          // Force search trigger to ensure fetch happens even if coords were same as before
          setSearchTrigger(prev => prev + 1);
        },
        (error) => {
          setIsSearching(false);
          console.error('Geolocation error:', error);
          alert('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí trên trình duyệt.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị');
    }
  };

  // When doing radius search, don't apply additional filters (API already filtered by distance)
  // Only apply name/loai/trang_thai filters when showing all parks
  const filteredParks = (() => {
    if (searchRadius && searchRadius > 0) {
      // In radius search mode - return as-is, distance filtering already done by API
      return displayedParks || [];
    }
    
    // In "show all parks" mode - apply name/loai/trang_thai filters
    return (displayedParks || []).filter((park) => {
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
    });
  })() || [];

  console.log('Filter debug:', {
    displayedParksCount: displayedParks?.length,
    filteredParksCount: filteredParks.length,
    filters,
    firstParkName: filteredParks[0]?.ten_cong_vien
  });

  const renderableParks = filteredParks.filter(p => 
    Array.isArray(p.toa_do_trung_tam) && 
    p.toa_do_trung_tam.length === 2 &&
    typeof p.toa_do_trung_tam[0] === 'number' && 
    typeof p.toa_do_trung_tam[1] === 'number'
  );
  const activeMapLayer = BASE_MAP_LAYERS[mapStyle] || { url: MAP_CONFIG.TILE_LAYER, attribution: MAP_CONFIG.ATTRIBUTION };

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

  const searchMarkerHandlers = useMemo(
    () => ({
      dragend: (e) => {
        const marker = e.target;
        if (marker) {
          const { lat, lng } = marker.getLatLng().wrap();
          // Validate coordinates
          if (isValidCoordinate(lat, lng)) {
            setSearchLocation([lat, lng]);
          } else {
            console.error('❌ Invalid coordinates:', { lat, lng });
            alert('Vị trí không hợp lệ. Vui lòng chọn vị trí khác.');
          }
        }
      },
    }),
    [] 
  );

  // ✅ Validation functions for GPS coordinates
  const isValidCoordinate = (lat, lng) => {
    if (!lat && lat !== 0 || !lng && lng !== 0) return false;
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // Clamp coordinate to valid range
  const clampCoordinate = (value, type = 'lat') => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (type === 'lat') return Math.max(-90, Math.min(90, num));
    return Math.max(-180, Math.min(180, num));
  };

  // Validate park coordinate before rendering
  const getValidParkPosition = (park) => {
    const coords = park.toa_do_trung_tam;
    if (!Array.isArray(coords) || coords.length !== 2) return null;
    
    const lat = clampCoordinate(coords[0], 'lat');
    const lng = clampCoordinate(coords[1], 'lng');
    
    if (lat === null || lng === null) return null;
    return [lat, lng];
  };

  return (
    <div className="park-map-page" style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div className="map-controls" style={{ 
        width: '350px', 
        backgroundColor: '#ffffff',
        color: '#111827',
        borderRight: '1px solid #e5e7eb', 
        display: 'flex', 
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '16px',
        boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
        zIndex: 500
      }}>
        <div className="control-section" style={{ marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '15px' }}>
          <h3 style={{ color: '#111827', fontWeight: '700', marginTop: 0 }}>Tìm Kiếm</h3>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Nhập tên công viên..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              style={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #d1d5db',
                color: '#111827',
                padding: '8px 12px',
                borderRadius: '6px',
                width: '100%',
                marginBottom: '10px'
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Tìm
            </button>
          </form>
        </div>

        <div className="control-section" style={{ marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
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
          {searchRadius !== null && (
            <button 
              onClick={() => {
                setSearchRadius(null);
              }} 
              className="btn btn-ghost btn-full" 
              style={{ marginTop: '8px', color: '#ef4444', borderColor: '#ef4444' }}
            >
              Xóa Tìm Kiếm
            </button>
          )}
          {isRouting && (
            <div style={{color: '#3b82f6', fontWeight: 'bold', textAlign: 'center', marginTop: '10px'}}>Đang tìm đường...</div>
          )}
          {routingDestination && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Chế độ chỉ đường:</h4>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <button 
                  onClick={() => setTransportMode('driving')} 
                  className={`btn btn-sm ${transportMode === 'driving' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >Ô tô</button>
                <button 
                  onClick={() => setTransportMode('bike')} 
                  className={`btn btn-sm ${transportMode === 'bike' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >Xe máy</button>
                <button 
                  onClick={() => setTransportMode('walking')} 
                  className={`btn btn-sm ${transportMode === 'walking' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >Đi bộ</button>
              </div>
              <button onClick={() => setRoutingDestination(null)} className="btn btn-ghost btn-full" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                Xóa Lộ Trình
              </button>
            </div>
          )}
        </div>

        <div className="control-section" style={{ marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>Giao diện bản đồ</label>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}
          >
            {Object.keys(BASE_MAP_LAYERS).map((key) => (
              <option key={key} value={key}>{BASE_MAP_LAYERS[key].label}</option>
            ))}
          </select>
          <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
            Chọn bản đồ nền đẹp mắt, trải nghiệm kiểu Leafmap.
          </p>
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
                  onClick={() => handleSidebarClick(park)}
                  style={{ 
                    opacity: 1, 
                    backgroundColor: selectedParkId === (park.ma_cong_vien || park.id) ? '#eff6ff' : '#ffffff',
                    borderTop: `1px solid ${selectedParkId === (park.ma_cong_vien || park.id) ? '#3b82f6' : '#f3f4f6'}`,
                    borderLeft: `1px solid ${selectedParkId === (park.ma_cong_vien || park.id) ? '#3b82f6' : '#f3f4f6'}`,
                    borderRight: `1px solid ${selectedParkId === (park.ma_cong_vien || park.id) ? '#3b82f6' : '#f3f4f6'}`,
                    borderBottom: '1px solid #e5e7eb',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'none'
                  }}
                >
                  <p className="park-name" style={{ color: '#111827', fontWeight: '700', fontSize: '15px', opacity: 1, marginBottom: '4px' }}>
                    {park.ten_cong_vien || park.tens}
                  </p>
                  <p className="park-info" style={{ color: '#4b5563', fontSize: '13px', opacity: 1, margin: 0 }}>
                    {(park.dien_tich_m2 / 10000).toFixed(2)} hecta
                    {park.khoang_cach_km ? ` • Cách ${park.khoang_cach_km} km` : ''}
                  </p>
                  {searchLocation && Array.isArray(park.toa_do_trung_tam) && park.toa_do_trung_tam.length === 2 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoutingDestination(park.toa_do_trung_tam);
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{ marginTop: '10px', width: '100%', fontSize: '13px', padding: '6px' }}
                    >
                      Chỉ đường tới đây
                    </button>
                  )}
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
        <MapContainer center={[centerLat || 10.8231, centerLng || 106.6797]} zoom={zoomLevel || 10} className="map">
          <TileLayer
            url={activeMapLayer.url}
            attribution={activeMapLayer.attribution}
          />
          <MapController />
          
          {/* Status Legend - Top-Left */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 400,
            fontSize: '12px',
            maxWidth: '220px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
              Tình Trạng Công Viên
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                <span style={{ color: '#374151' }}>Hoạt động</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                <span style={{ color: '#374151' }}>Sửa chữa / Xây dựng</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <span style={{ color: '#374151' }}>Đóng cửa</span>
              </div>
            </div>
          </div>
          
          <RoutingControl 
            start={searchLocation && routingDestination ? searchLocation : null} 
            end={routingDestination} 
            mode={transportMode}
            onRoutingStart={() => setIsRouting(true)}
            onRoutingEnd={() => setIsRouting(false)}
            onRoutingError={(e) => {
              setIsRouting(false);
              alert('Không thể tìm thấy đường đi. Vui lòng thử lại.');
              console.error('Routing Error:', e);
            }}
          />

          {searchLocation && (
            <>
              <Marker 
                position={searchLocation} 
                icon={userIcon}
                draggable={true}
                ref={searchMarkerRef}
                eventHandlers={searchMarkerHandlers}
                zIndexOffset={1000}
              >
                <Popup>Vị trí tìm kiếm<br/>(Kéo thả để thay đổi)</Popup>
              </Marker>
              <Circle center={searchLocation} radius={radius * 1000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
            </>
          )}

          {renderableParks.map((park) => {
            const isSelected = selectedParkId === (park.ma_cong_vien || park.id);
            const hasValidBoundary = park.ranh_gioi && 
              typeof park.ranh_gioi === 'object' && 
              park.ranh_gioi.coordinates && 
              Array.isArray(park.ranh_gioi.coordinates) && 
              park.ranh_gioi.coordinates.length > 0 &&
              park.ranh_gioi.coordinates[0].length > 0;
            
            const validPosition = getValidParkPosition(park);
            if (!validPosition) {
              console.warn(`⚠️  Park ${park.ma_cong_vien} has invalid coordinates:`, park.toa_do_trung_tam);
              return null;
            }
            
            if (isSelected) {
              console.log('Selected park:', {
                name: park.ten_cong_vien,
                id: park.ma_cong_vien,
                position: validPosition,
                hasBoundary: hasValidBoundary,
                boundaryCoords: hasValidBoundary ? park.ranh_gioi.coordinates[0].length : 0
              });
            }
            
            return (
              <Fragment key={`park-group-${park.ma_cong_vien || park.id}`}>
                {isSelected && hasValidBoundary && (
                  <Polygon
                    positions={park.ranh_gioi.coordinates[0].map(coord => [coord[1], coord[0]])}
                    pathOptions={{ 
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: 0.25,
                      weight: 3
                    }}
                  />
                )}
                <Marker
                  key={park.ma_cong_vien || park.id}
                  position={validPosition}
                  icon={getIconForStatus(park.trang_thai_ten, selectedParkId === (park.ma_cong_vien || park.id))}
                  zIndexOffset={selectedParkId === (park.ma_cong_vien || park.id) ? 1000 : 0}
                  eventHandlers={{
                    click: () => handleMapMarkerClick(park),
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h4>{park.ten_cong_vien || park.tens}</h4>
                      <p>📍 Tọa độ: [{validPosition[0].toFixed(4)}, {validPosition[1].toFixed(4)}]</p>
                      <p>📏 Diện tích: {(park.dien_tich_m2 / 10000).toFixed(2)} hecta</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <Link to={`/parks/${park.ma_cong_vien || park.id}`} className="btn btn-sm btn-primary" style={{ flex: 1 }}>
                          Chi tiết
                        </Link>
                        {searchLocation && validPosition && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              setRoutingDestination(validPosition);
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
              </Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
