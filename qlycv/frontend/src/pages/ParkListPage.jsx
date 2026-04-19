import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { parksAPI } from '../api';
import { formatArea, formatRating, getStatusColor } from '../constants';
import { useAuthStore, useUIStore } from '../store';

export default function ParkListPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [parks, setParks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';
  const isManager = user?.nhom_quyen_code === 'QUAN_LY';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await parksAPI.getList({ page, search: query || undefined, ordering: 'ten_cong_vien' });
        setParks(response.data.results || []);
        setCount(response.data.count || 0);
      } catch (error) {
        showNotification('Khong the tai danh sach cong vien', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, query, showNotification]);

  const totalPages = Math.max(1, Math.ceil(count / 20));
  const metrics = useMemo(() => ({
    totalArea: parks.reduce((sum, item) => sum + Number(item.dien_tich_m2 || 0), 0),
    verified: parks.filter((item) => item.da_xac_minh).length,
    active: parks.filter((item) => item.ma_trang_thai === 3 || item.trang_thai_ten === 'hoat_dong').length,
  }), [parks]);

  const handleDelete = async (parkId) => {
    if (!window.confirm('Xoa cong vien nay?')) return;
    try {
      await parksAPI.delete(parkId);
      setParks((current) => current.filter((item) => item.ma_cong_vien !== parkId));
      showNotification('Da xoa cong vien', 'success');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Khong the xoa cong vien', 'error');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Danh muc cong vien</div>
          <p className="page-subtitle">Bo cuc moi uu tien kha nang quan sat nhanh, tra cuu theo ten va truy cap tac vu chi tiet.</p>
        </div>
        {isAdmin && <Link className="btn btn-primary" to="/parks/create">Them cong vien</Link>}
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-label">Tong ban ghi dang xem</div><div className="stat-value">{count}</div><div className="stat-meta">Phan trang 20 muc / trang</div></div>
        <div className="card stat-card"><div className="stat-label">Tong dien tich trang hien tai</div><div className="stat-value">{formatArea(metrics.totalArea)}</div><div className="stat-meta">Du lieu theo bo loc hien hanh</div></div>
        <div className="card stat-card"><div className="stat-label">Da xac minh</div><div className="stat-value">{metrics.verified}</div><div className="stat-meta">{metrics.active} cong vien dang hoat dong</div></div>
      </div>

      <section className="card section-card">
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Bo loc va tim nhanh</h2>
            <p className="page-subtitle">Nhap ten cong vien de thu hep danh sach.</p>
          </div>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
          className="form-grid"
        >
          <div className="form-group">
            <label>Ten cong vien</label>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cong vien Tao Dan, Le Van Tam..." />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label>&nbsp;</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary">Ap dung</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); setQuery(''); setPage(1); }}>Xoa loc</button>
            </div>
          </div>
        </form>
      </section>

      <section className="card section-card" style={{ marginTop: 24 }}>
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : parks.length === 0 ? (
          <div className="empty-state"><p>Khong tim thay cong vien phu hop.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cong vien</th>
                  <th>Quan huyen</th>
                  <th>Dien tich</th>
                  <th>Cay xanh</th>
                  <th>Tien ich</th>
                  <th>Diem</th>
                  <th>Trang thai</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {parks.map((park) => (
                  <tr key={park.ma_cong_vien}>
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong>{park.ten_cong_vien}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{park.loai_ten || 'Chua phan loai'}</span>
                      </div>
                    </td>
                    <td>{park.quan_huyen_ten || 'N/A'}</td>
                    <td>{formatArea(park.dien_tich_m2)}</td>
                    <td>{park.cay_so_luong || 0}</td>
                    <td>{park.tien_ich_so_luong || 0}</td>
                    <td>{formatRating(park.diem_trung_binh)}</td>
                    <td>
                      <span className="badge">
                        <span className="badge-dot" style={{ backgroundColor: getStatusColor(park.trang_thai_ten || park.ma_trang_thai, 'park') }} />
                        {park.trang_thai_ten || park.ma_trang_thai || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link className="btn btn-ghost btn-sm" to={`/parks/${park.ma_cong_vien}`}>Chi tiet</Link>
                        {(isAdmin || (isManager && String(user?.ma_cong_vien) === String(park.ma_cong_vien))) && <Link className="btn btn-primary btn-sm" to={`/parks/${park.ma_cong_vien}/edit`}>Sua</Link>}
                        {isAdmin && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(park.ma_cong_vien)}>Xoa</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trang truoc</button>
          <div className="badge">Trang {page} / {totalPages}</div>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Trang sau</button>
        </div>
      </section>
    </div>
  );
}
