import { useEffect, useMemo, useState } from 'react';
import { parksAPI, ratingsAPI } from '../api';
import { formatDateTime, formatRating, safeArray } from '../constants';
import { useAuthStore, useUIStore } from '../store';

export default function RatingsPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [ratings, setRatings] = useState([]);
  const [parks, setParks] = useState([]);
  const [filters, setFilters] = useState({
    ma_cong_vien: user?.ma_cong_vien ? String(user.ma_cong_vien) : '',
    da_duyet: '',
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';
  const isManager = user?.nhom_quyen_code === 'QUAN_LY';
  const canModerate = isAdmin || isManager;
  const managedParkId = user?.ma_cong_vien ? String(user.ma_cong_vien) : '';

  const load = async () => {
    setLoading(true);
    try {
      const response = await ratingsAPI.getList({
        ordering: '-ngay_tao',
        ma_cong_vien: filters.ma_cong_vien || undefined,
        da_duyet: filters.da_duyet || undefined,
      });
      setRatings(safeArray(response.data));
    } catch {
      showNotification('Khong the tai danh gia', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadParks = async () => {
      try {
        const response = await parksAPI.getList({ limit: 200 });
        const parkList = safeArray(response.data);
        setParks(isManager ? parkList.filter((park) => String(park.ma_cong_vien) === managedParkId) : parkList);
      } catch {
        showNotification('Khong the tai danh sach cong vien', 'error');
      }
    };

    loadParks();
  }, [isManager, managedParkId, showNotification]);

  useEffect(() => {
    if (isManager && managedParkId) {
      setFilters((current) => ({ ...current, ma_cong_vien: managedParkId }));
    }
  }, [isManager, managedParkId]);

  useEffect(() => {
    load();
  }, [filters.ma_cong_vien, filters.da_duyet]);

  const stats = useMemo(() => ({
    average: ratings.length ? ratings.reduce((sum, item) => sum + Number(item.diem_tong_quat || 0), 0) / ratings.length : 0,
    pending: ratings.filter((item) => !item.da_duyet).length,
    approved: ratings.filter((item) => item.da_duyet).length,
  }), [ratings]);

  const handleModeration = async (id, approved) => {
    try {
      if (approved) await ratingsAPI.approve(id);
      else await ratingsAPI.reject(id);
      showNotification('Da cap nhat trang thai danh gia', 'success');
      load();
    } catch {
      showNotification('Khong the cap nhat danh gia', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoa danh gia nay?')) return;
    try {
      await ratingsAPI.delete(id);
      setRatings((current) => current.filter((item) => item.ma_danh_gia !== id));
      showNotification('Da xoa danh gia', 'success');
    } catch {
      showNotification('Khong the xoa danh gia', 'error');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Quan ly danh gia</div>
          <p className="page-subtitle">
            Admin quan ly toan bo danh gia. Manager chi kiem duyet danh gia cua cong vien duoc gan.
          </p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-label">Diem trung binh</div><div className="stat-value">{formatRating(stats.average)}</div><div className="stat-meta">Theo bo loc hien tai</div></div>
        <div className="card stat-card"><div className="stat-label">Da duyet</div><div className="stat-value">{stats.approved}</div><div className="stat-meta">Hien thi cong khai</div></div>
        <div className="card stat-card"><div className="stat-label">Cho duyet</div><div className="stat-value">{stats.pending}</div><div className="stat-meta">Can kiem tra noi dung</div></div>
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
            <label>Trang thai duyet</label>
            <select value={filters.da_duyet} onChange={(event) => setFilters((current) => ({ ...current, da_duyet: event.target.value }))}>
              <option value="">Tat ca</option>
              <option value="true">Da duyet</option>
              <option value="false">Cho duyet / tu choi</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card section-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : ratings.length === 0 ? (
          <div className="empty-state"><p>Chua co danh gia nao theo bo loc hien tai.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cong vien</th>
                  <th>Nguoi gui</th>
                  <th>Diem</th>
                  <th>Chi tiet</th>
                  <th>Noi dung</th>
                  <th>Ngay tao</th>
                  <th>Trang thai</th>
                  {canModerate && <th>Thao tac</th>}
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating.ma_danh_gia}>
                    <td>{rating.cong_vien_ten}</td>
                    <td>{rating.nguoi_dung_ten || 'Nguoi dung'}</td>
                    <td><span className="badge">{rating.diem_tong_quat || '-'} / 5</span></td>
                    <td>
                      <div style={{ display: 'grid', gap: 4, color: 'var(--muted)', fontSize: '0.88rem' }}>
                        <span>Ve sinh: {rating.diem_ve_sinh || '-'}</span>
                        <span>Tien ich: {rating.diem_tien_ich || '-'}</span>
                        <span>An toan: {rating.diem_an_toan || '-'}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{rating.noi_dung || 'Khong co nhan xet'}</td>
                    <td>{formatDateTime(rating.ngay_tao)}</td>
                    <td>{rating.da_duyet ? <span className="badge">Da duyet</span> : <span className="badge">Cho duyet</span>}</td>
                    {canModerate && (
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleModeration(rating.ma_danh_gia, true)}>Duyet</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleModeration(rating.ma_danh_gia, false)}>Tu choi</button>
                          {isAdmin && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(rating.ma_danh_gia)}>Xoa</button>}
                        </div>
                      </td>
                    )}
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
