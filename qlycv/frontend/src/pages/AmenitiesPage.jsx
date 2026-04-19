import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { amenitiesAPI, parksAPI } from '../api';
import { useAuthStore, useUIStore } from '../store';

export default function AmenitiesPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [amenities, setAmenities] = useState([]);
  const [parks, setParks] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ma_cong_vien: user?.ma_cong_vien || '', ma_loai_tien_ich: '' });

  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';
  const isManager = user?.nhom_quyen_code === 'QUAN_LY';
  const canManageAmenities = isAdmin || isManager;
  const managedParkId = user?.ma_cong_vien ? String(user.ma_cong_vien) : '';

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [parksResponse, typesResponse] = await Promise.all([
          parksAPI.getList({ limit: 100 }),
          amenitiesAPI.getTypes(),
        ]);
        const parkList = parksResponse.data.results || parksResponse.data || [];
        setParks(isManager ? parkList.filter((park) => String(park.ma_cong_vien) === managedParkId) : parkList);
        setTypes(typesResponse.data.results || typesResponse.data || []);
      } catch (error) {
        showNotification('Khong the tai bo loc tien ich', 'error');
      }
    };

    loadMeta();
  }, [isManager, managedParkId, showNotification]);

  useEffect(() => {
    if (isManager && managedParkId) {
      setFilters((current) => ({ ...current, ma_cong_vien: managedParkId }));
    }
  }, [isManager, managedParkId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await amenitiesAPI.getList({
          ma_cong_vien: filters.ma_cong_vien || undefined,
          ma_loai_tien_ich: filters.ma_loai_tien_ich || undefined,
        });
        setAmenities(response.data.results || response.data || []);
      } catch (error) {
        showNotification('Khong the tai danh sach tien ich', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters, showNotification]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xoa tien ich nay?')) return;
    try {
      await amenitiesAPI.delete(id);
      setAmenities((current) => current.filter((item) => item.ma_tien_ich !== id));
      showNotification('Da xoa tien ich', 'success');
    } catch {
      showNotification('Khong the xoa tien ich', 'error');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Tien ich cong vien</div>
          <p className="page-subtitle">Theo doi tai san van hanh theo tung cong vien va tung loai tien ich trong mot bang duy nhat.</p>
        </div>
        {canManageAmenities && <Link className="btn btn-primary" to="/amenities/create">Them tien ich</Link>}
      </div>

      <section className="card section-card" style={{ marginBottom: 24 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Cong vien</label>
            <select
              value={filters.ma_cong_vien}
              onChange={(event) => setFilters((current) => ({ ...current, ma_cong_vien: event.target.value }))}
              disabled={isManager}
            >
              <option value="">{isManager ? 'Cong vien duoc giao' : 'Tat ca cong vien'}</option>
              {parks.map((park) => <option key={park.ma_cong_vien} value={park.ma_cong_vien}>{park.ten_cong_vien}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Loai tien ich</label>
            <select value={filters.ma_loai_tien_ich} onChange={(event) => setFilters((current) => ({ ...current, ma_loai_tien_ich: event.target.value }))}>
              <option value="">Tat ca loai</option>
              {types.map((type) => <option key={type.ma_loai_tien_ich} value={type.ma_loai_tien_ich}>{type.ten_loai}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="card section-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cong vien</th>
                  <th>Loai tien ich</th>
                  <th>So luong</th>
                  <th>Tinh trang</th>
                  <th>Van hanh</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {amenities.map((item) => (
                  <tr key={item.ma_tien_ich}>
                    <td>{item.cong_vien_ten}</td>
                    <td>{item.loai_tien_ich_ten}</td>
                    <td>{item.so_luong}</td>
                    <td>{item.tinh_trang}</td>
                    <td>{item.dang_su_dung ? 'Dang su dung' : 'Tam ngung'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {canManageAmenities && <Link className="btn btn-primary btn-sm" to={`/amenities/${item.ma_tien_ich}/edit`}>Sua</Link>}
                        {canManageAmenities && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item.ma_tien_ich)}>Xoa</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
