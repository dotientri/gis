'use client';

import { useState, useEffect, useMemo, useTransition, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { savePark, getNearbyParks, updatePark, deletePark } from '../app/actions';
import type { Park } from '../app/actions';
import { Edit, Trash2, LoaderCircle, Menu } from 'lucide-react';

// --- FORM THÊM CÔNG VIÊN ---
function AddParkForm({ lat, lon, onSave }: { lat: number; lon: number; onSave: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await savePark(formData);
        onSave();
        router.refresh();
      } catch (error) {
        alert((error as Error).message);
      }
    });
  };

  return (
    <form action={handleSubmit} className="p-2 space-y-3 w-80">
      <h3 className="font-bold text-center text-lg">Thêm công viên mới</h3>
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lon" value={lon} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Tên công viên</label>
        <input id="name" name="name" required className="w-full p-2 border rounded-md" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Mô tả</label>
        <textarea id="description" name="description" className="w-full p-2 border rounded-md" rows={2}></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tree_count" className="block text-sm font-medium">Số cây xanh</label>
          <input type="number" id="tree_count" name="tree_count" defaultValue="0" min="0" className="w-full p-2 border rounded-md"/>
        </div>
        <div>
          <label htmlFor="toilet_count" className="block text-sm font-medium">Số nhà vệ sinh</label>
          <input type="number" id="toilet_count" name="toilet_count" defaultValue="0" min="0" className="w-full p-2 border rounded-md"/>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="opening_time" className="block text-sm font-medium">Giờ mở cửa</label>
          <input type="time" id="opening_time" name="opening_time" className="w-full p-2 border rounded-md" />
        </div>
        <div>
          <label htmlFor="closing_time" className="block text-sm font-medium">Giờ đóng cửa</label>
          <input type="time" id="closing_time" name="closing_time" className="w-full p-2 border rounded-md" />
        </div>
      </div>
      <div className="flex items-center">
        <input type="checkbox" id="is_active" name="is_active" defaultChecked={true} className="h-4 w-4 rounded"/>
        <label htmlFor="is_active" className="ml-2 block text-sm">Cho phép hoạt động</label>
      </div>
      <button type="submit" disabled={isPending} className="w-full p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
        {isPending ? 'Đang lưu...' : 'Lưu Công Viên'}
      </button>
    </form>
  );
}

// --- FORM SỬA DẠNG POPUP (MODAL) ---
function EditParkModal({ park, onClose }: { park: Park; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updatePark(park.id, formData);
        onClose();
        router.refresh();
      } catch (error) {
        alert((error as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <form action={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh sửa: {park.name}</h2>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Tên Công Viên</label>
            <input type="text" id="name" name="name" defaultValue={park.name} required className="mt-1 block w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Mô Tả</label>
            <textarea id="description" name="description" defaultValue={park.description ?? ''} rows={3} className="mt-1 block w-full p-2 border rounded-md"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tree_count" className="block text-sm font-medium">Số cây xanh</label>
              <input type="number" id="tree_count" name="tree_count" defaultValue={park.tree_count} min="0" className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
            <div>
              <label htmlFor="toilet_count" className="block text-sm font-medium">Số nhà vệ sinh</label>
              <input type="number" id="toilet_count" name="toilet_count" defaultValue={park.toilet_count} min="0" className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="opening_time" className="block text-sm font-medium">Giờ mở cửa</label>
              <input type="time" id="opening_time" name="opening_time" defaultValue={park.opening_time ?? ''} className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
            <div>
              <label htmlFor="closing_time" className="block text-sm font-medium">Giờ đóng cửa</label>
              <input type="time" id="closing_time" name="closing_time" defaultValue={park.closing_time ?? ''} className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
          </div>
          <div className="flex items-start">
            <input id="is_active" name="is_active" type="checkbox" defaultChecked={park.is_active} className="h-4 w-4 rounded"/>
            <div className="ml-3 text-sm">
              <label htmlFor="is_active" className="font-medium">Cho phép hoạt động</label>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border rounded-md">Hủy</button>
            <button type="submit" disabled={isPending} className="py-2 px-4 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
              {isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- DANH SÁCH CÔNG VIÊN GẦN ĐÂY ---
function NearbyParks({ parks, onParkClick, onEdit, onDelete }: { parks: Park[], onParkClick: (park: Park) => void, onEdit: (park: Park) => void, onDelete: (id: number) => void }) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa công viên này không?')) {
      startDeleteTransition(async () => {
        await deletePark(id);
        router.refresh();
      });
    }
  };

  if (parks.length === 0) return <p className="text-sm text-gray-500">Chưa tìm thấy công viên nào.</p>;
  const formatTime = (time: string | null) => time ? time.substring(0, 5) : 'N/A';

  return (
    <div className="space-y-2">
      {parks.map(park => (
        <div key={park.id} className="p-2 border rounded-md hover:bg-gray-50">
          <div onClick={() => onParkClick(park)} className="cursor-pointer">
            <h4 className="font-bold">{park.name}</h4>
            <p className={`text-xs font-semibold ${park.is_open_now ? 'text-green-600' : 'text-red-600'}`}>{park.is_open_now ? `Đang mở cửa` : 'Đã đóng cửa'}</p>
            <p className="text-xs text-blue-500">Cách khoảng {park.distance?.toFixed(0)}m</p>
          </div>
          <div className="flex items-center gap-4 mt-2 pt-2 border-t">
            <button onClick={() => onEdit(park)} className="flex items-center gap-1 text-xs text-yellow-600 hover:underline"><Edit size={14}/> Sửa</button>
            <button onClick={() => handleDelete(park.id)} disabled={isDeleting} className="flex items-center gap-1 text-xs text-red-600 hover:underline disabled:text-gray-400">
              {isDeleting ? <LoaderCircle size={14} className="animate-spin"/> : <Trash2 size={14}/>} Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

// --- COMPONENT BẢN ĐỒ CHÍNH ---
export default function Map({ initialParks }: { initialParks: Park[] }) {
  const [parks, setParks] = useState(initialParks);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [isFinding, startFindingTransition] = useTransition();
  const [editingPark, setEditingPark] = useState<Park | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [clickedPosition, setClickedPosition] = useState<L.LatLng | null>(null);
  const router = useRouter();

  const DefaultIcon = useMemo(() => L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }), []);
  const UserLocationIcon = useMemo(() => L.divIcon({
      html: `<div class="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>`,
      className: 'relative flex items-center justify-center',
      iconSize: [12, 12],
  }), []);

  useEffect(() => { L.Marker.prototype.options.icon = DefaultIcon; }, [DefaultIcon]);
  useEffect(() => { setParks(initialParks); }, [initialParks]);
  
  const handleLocateMe = () => {
    if (mapInstance) mapInstance.locate({ setView: true, maxZoom: 15 });
  };
  
  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.on('locationfound', (e) => {
      setUserLocation(e.latlng);
      startFindingTransition(async () => {
        const foundParks = await getNearbyParks(e.latlng.lat, e.latlng.lng);
        setParks(foundParks);
      });
    });
    mapInstance.on('locationerror', (e) => alert(e.message));
    handleLocateMe();
  }, [mapInstance]);

  const handleParkClickFromList = (park: Park) => {
    if (park.geom_point) mapInstance?.flyTo([park.geom_point.coordinates[1], park.geom_point.coordinates[0]], 16);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa công viên này không?')) {
      await deletePark(id);
      router.refresh();
    }
  };

  return (
    <Fragment>
      <div className="flex h-screen">
        <div className={`bg-white shadow-lg overflow-y-auto transition-all duration-300 ${isPanelOpen ? 'w-1/3 p-4' : 'w-0 p-0'}`}>
          <h3 className="text-xl font-bold mb-4">Các công viên</h3>
          {isFinding ? <LoaderCircle className="animate-spin"/> : <NearbyParks parks={parks} onParkClick={handleParkClickFromList} onEdit={setEditingPark} onDelete={handleDelete} />}
        </div>
        <div className={`relative h-full transition-all duration-300 ${isPanelOpen ? 'w-2/3' : 'w-full'}`}>
          <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute top-4 left-4 z-[1000] w-10 h-10 bg-white rounded-md shadow-lg flex items-center justify-center">
            <Menu size={20} />
          </button>
          <button onClick={handleLocateMe} className="absolute bottom-8 right-4 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l-7-7 7-7 7 7-7 7z"></path></svg>
          </button>
          <MapContainer ref={setMapInstance} center={[10.7769, 106.7009]} zoom={13} className="h-full w-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {parks.map((park) => (
              <Marker key={park.id} position={[park.geom_point.coordinates[1], park.geom_point.coordinates[0]]}>
                <Popup>
                  <h3 className="font-bold text-base">{park.name}</h3>
                  {userLocation && (<a href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${park.geom_point.coordinates[1]},${park.geom_point.coordinates[0]}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Chỉ đường tới đây</a>)}
                </Popup>
              </Marker>
            ))}
            {userLocation && <Marker position={userLocation} icon={UserLocationIcon}><Popup>Vị trí của bạn</Popup></Marker>}
            {clickedPosition && (<Popup position={clickedPosition}><AddParkForm lat={clickedPosition.lat} lon={clickedPosition.lng} onSave={() => setClickedPosition(null)} /></Popup>)}
            <MapEvents onMapClick={(latlng) => setClickedPosition(latlng)} />
          </MapContainer>
        </div>
      </div>
      {editingPark && <EditParkModal park={editingPark} onClose={() => setEditingPark(null)} />}
    </Fragment>
  );
}
