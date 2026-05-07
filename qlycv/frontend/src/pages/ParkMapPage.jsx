import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Circle, GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import { parksAPI } from '../api';
import { MAP_CONFIG, PARK_STATUS_LABELS, formatArea, getStatusColor, safeArray } from '../constants';
import { useUIStore } from '../store';
import 'leaflet/dist/leaflet.css';

const iconCache = new Map();
const STATUS_ORDER = ['tat_ca', 'hoat_dong', 'dang_xay_dung', 'cai_tao', 'tam_dong', 'ngung_hoat_dong', 'quy_hoach'];
const provider = new OpenStreetMapProvider();

function dedupeParks(list) {
  const seen = new Set();
  return safeArray(list).filter((park) => {
    if (!park?.ma_cong_vien || seen.has(park.ma_cong_vien)) {
      return false;
    }
    seen.add(park.ma_cong_vien);
    return true;
  });
}

function getParkIcon(color) {
  if (!iconCache.has(color)) {
    iconCache.set(
      color,
      L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 10px 24px rgba(0,0,0,.18)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
    );
  }
  return iconCache.get(color);
}

function MapViewportController({ center, routePath }) {
  const map = useMap();

  useEffect(() => {
    if (routePath.length > 1) {
      map.fitBounds(routePath, { padding: [40, 40] });
      return;
    }

    if (Array.isArray(center) && center.length === 2) {
      map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.8 });
    }
  }, [center, map, routePath]);

  return null;
}

function MapSearchControl() {
  const map = useMap();

  useEffect(() => {
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: true,
      showPopup: true,
      marker: {
        icon: new L.Icon.Default(),
        draggable: false,
      },
      popupFormat: ({ query, result }) => `${query}: ${result.label}`,
      maxMarkers: 1,
      autoClose: true,
      keepResult: true,
      searchLabel: 'Tìm trường đại học, bệnh viện, địa điểm...',
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
}

function getBoundaryFeature(park) {
  const geometry = park?.ranh_gioi;

  if (!geometry || typeof geometry !== 'object') {
    return null;
  }

  if (geometry.type === 'Feature') {
    return geometry;
  }

  if (geometry.type === 'FeatureCollection') {
    return geometry.features?.[0] || null;
  }

  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return {
      type: 'Feature',
      properties: {
        ten_cong_vien: park?.ten_cong_vien,
      },
      geometry,
    };
  }

  return null;
}

const formatInstruction = (step, index) => {
  const modifierMap = {
    straight: 'đi thẳng',
    left: 'rẽ trái',
    right: 'rẽ phải',
    slight_left: 'chéo trái',
    slight_right: 'chéo phải',
    sharp_left: 'quẹo gắt trái',
    sharp_right: 'quẹo gắt phải',
    uturn: 'quay đầu',
  };

  const typeMap = {
    depart: 'Xuất phát',
    arrive: 'Đến nơi',
    roundabout: 'Vào vòng xoay',
    rotary: 'Đi vào bùng binh',
    merge: 'Nhập làn',
    fork: 'Tách nhánh',
    on_ramp: 'Lên dốc nhập làn',
    off_ramp: 'Ra khỏi làn',
    end_of_road: 'Cuối đường',
    continue: 'Tiếp tục',
    turn: 'Rẽ',
    new_name: 'Đi tiếp',
  };

  const roadName = step.name ? ` vào ${step.name}` : '';
  const direction = modifierMap[step.maneuver.modifier] || '';
  const action = typeMap[step.maneuver.type] || 'Di chuyển';
  const distance = step.distance ? `${(step.distance / 1000).toFixed(step.distance >= 1000 ? 1 : 2)} km` : '';

  if (step.maneuver.type === 'arrive') {
    return { id: `${index}-${step.name}`, text: 'Đến công viên đã chọn.', distance: '' };
  }

  if (step.maneuver.type === 'depart') {
    return { id: `${index}-${step.name}`, text: `Xuất phát${roadName}`, distance };
  }

  if (step.maneuver.type === 'roundabout' || step.maneuver.type === 'rotary') {
    return { id: `${index}-${step.name}`, text: `${action}${roadName}${direction ? `, sau đó ${direction}` : ''}`, distance };
  }

  return {
    id: `${index}-${step.name}`,
    text: `${action}${direction ? ` ${direction}` : ''}${roadName}`.trim(),
    distance,
  };
};

export default function ParkMapPage() {
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState(null);
  const [routeDurationMinutes, setRouteDurationMinutes] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('tat_ca');
  const [radiusKm, setRadiusKm] = useState(5);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [nearbyParkIds, setNearbyParkIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await parksAPI.getAllForMap({ include_quy_hoach: true });
        const list = dedupeParks(response.data);
        setParks(list);
        if (list[0]) setSelectedId(list[0].ma_cong_vien);
      } catch (error) {
        showNotification('Không thể tải bản đồ công viên', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showNotification]);

  const statusOptions = useMemo(() => {
    const available = new Set(
      parks
        .map((park) => park.ma_trang_thai_code || park.trang_thai_ten)
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
    );

    return STATUS_ORDER.filter((code) => code === 'tat_ca' || available.has(code)).map((code) => ({
      code,
      label: code === 'tat_ca' ? 'Tất cả' : PARK_STATUS_LABELS[code] || code,
      color: code === 'tat_ca' ? 'var(--text)' : getStatusColor(code, 'park'),
    }));
  }, [parks]);

  const filteredParks = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return parks.filter((park) => {
      if (!Array.isArray(park.toa_do_trung_tam) || park.toa_do_trung_tam.length < 2) return false;
      const statusCode = String(park.ma_trang_thai_code || park.trang_thai_ten || '').toLowerCase();
      if (statusFilter !== 'tat_ca' && statusCode !== statusFilter) return false;
      if (nearbyOnly && nearbyParkIds.length > 0 && !nearbyParkIds.includes(park.ma_cong_vien)) return false;
      if (!normalized) return true;
      return `${park.ten_cong_vien} ${park.quan_huyen_ten || ''}`.toLowerCase().includes(normalized);
    });
  }, [keyword, nearbyOnly, nearbyParkIds, parks, statusFilter]);

  useEffect(() => {
    if (!filteredParks.some((item) => item.ma_cong_vien === selectedId)) {
      setSelectedId(filteredParks[0]?.ma_cong_vien || null);
    }
  }, [filteredParks, selectedId]);

  const selectedPark = filteredParks.find((item) => item.ma_cong_vien === selectedId) || filteredParks[0];
  const remainingParks = filteredParks.filter((park) => park.ma_cong_vien !== selectedPark?.ma_cong_vien);
  const center = selectedPark?.toa_do_trung_tam || userLocation || MAP_CONFIG.DEFAULT_CENTER;
  const selectedParkBoundary = useMemo(() => getBoundaryFeature(selectedPark), [selectedPark]);
  const showSelectedBoundary = Boolean(selectedParkBoundary) && routePath.length === 0;

  const buildRouteToPark = async (park, originLocation = userLocation) => {
    if (!originLocation) {
      showNotification('Hãy lấy vị trí hiện tại trước khi chỉ đường.', 'error');
      return;
    }
    if (!park?.toa_do_trung_tam?.length) {
      showNotification('Công viên này chưa có tọa độ để dẫn đường.', 'error');
      return;
    }

    setRouteLoading(true);
    try {
      const [destLat, destLng] = park.toa_do_trung_tam;
      const [userLat, userLng] = originLocation;
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();
      const route = data?.routes?.[0];
      if (!route?.geometry?.coordinates?.length) {
        throw new Error('Không tìm thấy lộ trình.');
      }

      setSelectedId(park.ma_cong_vien);
      setRoutePath(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
      setRouteDistanceKm(route.distance ? route.distance / 1000 : null);
      setRouteDurationMinutes(route.duration ? route.duration / 60 : null);
      const steps = route.legs?.flatMap((leg) => leg.steps || []).map(formatInstruction) || [];
      setRouteSteps(steps);
    } catch (error) {
      setRoutePath([]);
      setRouteDistanceKm(null);
      setRouteDurationMinutes(null);
      setRouteSteps([]);
      showNotification('Không thể tạo lộ trình tự động trong bản đồ.', 'error');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleUserLocationDragEnd = (event) => {
    const next = event.target.getLatLng();
    const nextLocation = [next.lat, next.lng];

    setUserLocation(nextLocation);

    if (nearbyOnly) {
      setNearbyOnly(false);
      setNearbyParkIds([]);
    }

    if (routePath.length > 0 && selectedPark) {
      buildRouteToPark(selectedPark, nextLocation);
      return;
    }

    setRoutePath([]);
    setRouteDistanceKm(null);
    setRouteDurationMinutes(null);
    setRouteSteps([]);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      showNotification('Trình duyệt không hỗ trợ định vị.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        showNotification('Đã lấy vị trí hiện tại. Bạn có thể chỉ đường hoặc tìm công viên gần nhất.', 'success');
      },
      () => showNotification('Không thể lấy vị trí hiện tại của bạn.', 'error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleNearbySearch = async () => {
    if (!userLocation) {
      showNotification('Hãy lấy vị trí hiện tại trước khi tìm trong bán kính.', 'error');
      return;
    }

    try {
      const response = await parksAPI.getNearestParks(userLocation[0], userLocation[1], radiusKm);
      const results = dedupeParks(response.data);
      setNearbyParkIds(results.map((item) => item.ma_cong_vien));
      setNearbyOnly(true);
      if (results[0]) setSelectedId(results[0].ma_cong_vien);
      showNotification(`Đã tìm thấy ${results.length} công viên trong bán kính ${radiusKm} km.`, 'success');
    } catch (error) {
      showNotification('Không thể tìm công viên trong bán kính đã chọn.', 'error');
    }
  };

  const clearRoute = () => {
    setUserLocation(null);
    setRoutePath([]);
    setRouteDistanceKm(null);
    setRouteDurationMinutes(null);
    setRouteSteps([]);
    setNearbyOnly(false);
    setNearbyParkIds([]);
  };

  const handleSelectPark = (parkId) => {
    setSelectedId(parkId);
    setRoutePath([]);
    setRouteDistanceKm(null);
    setRouteDurationMinutes(null);
    setRouteSteps([]);
  };

  return (
    <div className="page-shell map-page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Bản đồ công viên</div>
          <p className="page-subtitle">Tìm địa điểm bất kỳ trên map, lọc theo trạng thái, tìm công viên trong bán kính và xem chỉ dẫn từng chặng ngay bên trong bản đồ.</p>
        </div>
      </div>

      <div className="map-layout">
        <section className="card section-card map-sidebar">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Tìm công viên trong hệ thống</label>
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Nhập tên công viên hoặc quận huyện" />
          </div>

          <div className="status-filter-bar">
            {statusOptions.map((status) => (
              <button
                key={status.code}
                type="button"
                className={`status-chip${statusFilter === status.code ? ' active' : ''}`}
                onClick={() => setStatusFilter(status.code)}
                style={{ '--chip-color': status.color }}
              >
                <span className="status-chip-dot" />
                {status.label}
              </button>
            ))}
          </div>

          <div className="map-actions-grid">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLocateUser}>Dùng vị trí của tôi</button>
            {userLocation && <button type="button" className="btn btn-ghost btn-sm" onClick={clearRoute}>Xóa vị trí và lộ trình</button>}
          </div>

          <div className="radius-search-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Tìm trong bán kính</label>
              <select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>
                <option value={1}>1 km</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleNearbySearch}>Tìm gần tôi</button>
            {nearbyOnly && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setNearbyOnly(false); setNearbyParkIds([]); }}>Bỏ lọc bán kính</button>}
          </div>

          {selectedPark && (
            <div className="notice">
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <span className="badge" style={{ marginBottom: 8 }}>Công viên đang xem</span>
                  <div><strong>{selectedPark.ten_cong_vien}</strong></div>
                  <div style={{ color: 'var(--muted)', marginTop: 6 }}>{selectedPark.quan_huyen_ten || 'N/A'} • {formatArea(selectedPark.dien_tich_m2)}</div>
                  {selectedPark.trang_thai_van_hanh_label && (
                    <div style={{ color: 'var(--muted)', marginTop: 6 }}>{selectedPark.trang_thai_van_hanh_label}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link className="btn btn-ghost btn-sm" to={`/parks/${selectedPark.ma_cong_vien}`}>Xem chi tiết</Link>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => buildRouteToPark(selectedPark)}>Chỉ đường</button>
                </div>
                <div style={{ color: 'var(--muted)' }}>
                  {routeLoading
                    ? 'Đang tính lộ trình trong bản đồ...'
                    : routeDistanceKm && routeDurationMinutes
                      ? `Khoảng cách ${routeDistanceKm.toFixed(1)} km • Thời gian ${Math.round(routeDurationMinutes)} phút`
                      : userLocation
                        ? 'Bấm Chỉ đường để tạo lộ trình.'
                        : 'Bấm Dùng vị trí của tôi để bật chỉ đường.'}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : filteredParks.length === 0 ? (
            <div className="empty-state"><p>Không có công viên nào khớp bộ lọc hiện tại.</p></div>
          ) : (
            <div className="map-list">
              {remainingParks.map((park) => {
                const statusCode = String(park.ma_trang_thai_code || park.trang_thai_ten || '').toLowerCase();
                return (
                  <button
                    key={park.ma_cong_vien}
                    type="button"
                    className="notice"
                    style={{
                      textAlign: 'left',
                      background: selectedId === park.ma_cong_vien ? 'rgba(23,114,69,0.10)' : undefined,
                      borderColor: selectedId === park.ma_cong_vien ? 'rgba(23,114,69,0.28)' : undefined,
                    }}
                    onClick={() => handleSelectPark(park.ma_cong_vien)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <strong>{park.ten_cong_vien}</strong>
                      <span className="badge">
                        <span className="badge-dot" style={{ backgroundColor: getStatusColor(statusCode, 'park') }} />
                        {PARK_STATUS_LABELS[statusCode] || park.trang_thai_ten || 'N/A'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--muted)', marginTop: 6 }}>{park.quan_huyen_ten || 'N/A'} • {formatArea(park.dien_tich_m2)}</div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge">Dang xem</span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="btn btn-primary btn-sm"
                        onClick={(event) => { event.stopPropagation(); buildRouteToPark(park); }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            buildRouteToPark(park);
                          }
                        }}
                      >
                        Chỉ đường
                      </span>
                    </div>
                  </button>
                );
              })}
              {remainingParks.length === 0 && selectedPark && (
                <div className="notice">
                  Không còn công viên nào khác trong bộ lọc hiện tại.
                </div>
              )}
            </div>
          )}
        </section>

        <section className="card section-card map-board">
          <div className="map-board-inner">
            <MapContainer key={`${selectedId || 'default'}-${userLocation?.join(',') || 'nouser'}-${statusFilter}-${nearbyOnly}`} center={center} zoom={selectedPark ? 14 : MAP_CONFIG.DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution={MAP_CONFIG.ATTRIBUTION} url={MAP_CONFIG.TILE_LAYER} />
              <MapSearchControl />
              <MapViewportController center={center} routePath={routePath} />
              {userLocation && (
                <Marker
                  position={userLocation}
                  draggable
                  autoPan
                  eventHandlers={{ dragend: handleUserLocationDragEnd }}
                >
                  <Popup>Vị trí bắt đầu của bạn. Kéo marker để đổi điểm xuất phát.</Popup>
                </Marker>
              )}
              {userLocation && nearbyOnly && <Circle center={userLocation} radius={radiusKm * 1000} pathOptions={{ color: '#177245', fillColor: '#177245', fillOpacity: 0.08, weight: 2 }} />}
              {showSelectedBoundary && (
                <GeoJSON
                  key={`boundary-${selectedPark.ma_cong_vien}`}
                  data={selectedParkBoundary}
                  style={() => ({
                    color: '#177245',
                    weight: 3,
                    opacity: 0.95,
                    fillColor: '#22c55e',
                    fillOpacity: 0.12,
                  })}
                />
              )}
              {routePath.length > 0 && <Polyline positions={routePath} pathOptions={{ color: '#177245', weight: 6, opacity: 0.9 }} />}
              {filteredParks.map((park) => {
                const coords = park.toa_do_trung_tam;
                if (!Array.isArray(coords) || coords.length < 2) return null;
                const statusCode = String(park.ma_trang_thai_code || park.trang_thai_ten || '').toLowerCase();
                return (
                  <Marker
                    key={park.ma_cong_vien}
                    position={coords}
                    icon={getParkIcon(getStatusColor(statusCode, 'park'))}
                    eventHandlers={{ click: () => handleSelectPark(park.ma_cong_vien) }}
                  >
                    <Popup>
                      <strong>{park.ten_cong_vien}</strong>
                      <div>{park.quan_huyen_ten || 'N/A'}</div>
                      <div>{formatArea(park.dien_tich_m2)}</div>
                      <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                        <Link to={`/parks/${park.ma_cong_vien}`}>Mở chi tiết</Link>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => buildRouteToPark(park)}>Chỉ đường</button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {routeSteps.length > 0 && (
              <div className="map-route-panel">
                <div className="map-route-panel-head">
                  <div>
                    <strong>Hướng dẫn chỉ đường</strong>
                    <div className="map-route-panel-meta">
                      {routeDistanceKm && routeDurationMinutes
                        ? `${routeDistanceKm.toFixed(1)} km • ${Math.round(routeDurationMinutes)} phút`
                        : 'Lộ trình đang hiển thị trên bản đồ'}
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={clearRoute}>Đóng</button>
                </div>
                <div className="direction-list">
                  {routeSteps.map((step) => (
                    <div key={step.id} className="direction-item">
                      <div>{step.text}</div>
                      {step.distance && <small>{step.distance}</small>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
