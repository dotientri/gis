import { useEffect, useMemo, useRef, useState } from 'react';
import { FeatureGroup, MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import { MAP_CONFIG } from '../../constants';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const DEFAULT_CENTER = MAP_CONFIG.DEFAULT_CENTER || [10.8231, 106.6797];

function resolveCenter(lat, lng) {
  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);

  if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
    return [parsedLat, parsedLng];
  }

  return DEFAULT_CENTER;
}

function geometryToPolygonPositions(geometry) {
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates?.[0])) {
    return null;
  }

  return geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
}

async function reverseGeocode(lat, lng) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'vi');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Reverse geocoding failed');
  }

  const data = await response.json();
  return data.display_name || '';
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng, { shouldLookupAddress: true });
    },
  });

  return null;
}

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function GeocoderControl({ onPick, onAddressChange, address }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    const provider = new OpenStreetMapProvider({
      params: {
        countrycodes: 'vn',
      },
    });

    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      searchLabel: 'Tim dia chi hoac ten dia diem',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      keepResult: true,
      retainZoomLevel: false,
      animateZoom: true,
    });

    controlRef.current = searchControl;
    map.addControl(searchControl);

    const handleResult = (event) => {
      const location = event.location;
      if (!location) return;

      onPick(location.y, location.x, { shouldLookupAddress: false });
      if (location.label) {
        onAddressChange?.(location.label);
      }
    };

    map.on('geosearch/showlocation', handleResult);

    return () => {
      map.off('geosearch/showlocation', handleResult);
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, onAddressChange, onPick]);

  useEffect(() => {
    const input = map.getContainer().querySelector('.glass');
    if (input && address && document.activeElement !== input && input.value !== address) {
      input.value = address;
    }
  }, [address, map]);

  return null;
}

function BoundaryEditor({ boundary, onBoundaryChange }) {
  const positions = useMemo(() => geometryToPolygonPositions(boundary), [boundary]);

  if (!onBoundaryChange) {
    return positions ? <Polygon positions={positions} pathOptions={{ color: '#2563eb' }} /> : null;
  }

  return (
    <FeatureGroup>
      <EditControl
        position="topright"
        onCreated={(event) => {
          if (event.layerType === 'polygon') {
            onBoundaryChange(event.layer.toGeoJSON().geometry);
          }
        }}
        onEdited={(event) => {
          event.layers.eachLayer((layer) => {
            onBoundaryChange(layer.toGeoJSON().geometry);
          });
        }}
        onDeleted={() => onBoundaryChange(null)}
        draw={{
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: true,
        }}
      />
      {positions && <Polygon positions={positions} pathOptions={{ color: '#2563eb' }} />}
    </FeatureGroup>
  );
}

export default function ParkLocationPicker({
  lat,
  lng,
  address,
  onPick,
  onAddressChange,
  boundary = null,
  onBoundaryChange,
  height = 400,
}) {
  const center = useMemo(() => resolveCenter(lat, lng), [lat, lng]);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const requestRef = useRef(0);
  const hasPosition = Number.isFinite(Number.parseFloat(lat)) && Number.isFinite(Number.parseFloat(lng));

  const handlePick = async (nextLat, nextLng, options = {}) => {
    const { shouldLookupAddress = true } = options;
    onPick(nextLat, nextLng);

    if (!shouldLookupAddress || !onAddressChange) {
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setIsResolvingAddress(true);

    try {
      const nextAddress = await reverseGeocode(nextLat, nextLng);
      if (requestRef.current === requestId && nextAddress) {
        onAddressChange(nextAddress);
      }
    } catch (error) {
      console.error('Khong the lay dia chi tu toa do', error);
    } finally {
      if (requestRef.current === requestId) {
        setIsResolvingAddress(false);
      }
    }
  };

  return (
    <div className="park-location-picker">
      <div className="park-location-map" style={{ height }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url={MAP_CONFIG.TILE_LAYER} attribution={MAP_CONFIG.ATTRIBUTION} />
          <ClickHandler onPick={handlePick} />
          <GeocoderControl onPick={handlePick} onAddressChange={onAddressChange} address={address} />
          <RecenterMap center={center} />
          <Marker
            position={center}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const next = event.target.getLatLng();
                handlePick(next.lat, next.lng, { shouldLookupAddress: true });
              },
            }}
          />
          {(boundary || onBoundaryChange) && (
            <BoundaryEditor boundary={boundary} onBoundaryChange={onBoundaryChange} />
          )}
        </MapContainer>
      </div>
      <small className="park-location-help">
        Tim dia chi o o search tren ban do, click truc tiep hoac keo marker de chot vi tri.
        {onBoundaryChange && ' Dung cong cu da giac ben phai de ve hoac chinh sua ranh gioi.'}
        {isResolvingAddress && ' Dang cap nhat dia chi gan nhat...'}
        {!hasPosition && ' Cong vien chua co toa do se dung vi tri mac dinh cho toi khi ban cap nhat.'}
      </small>
    </div>
  );
}
