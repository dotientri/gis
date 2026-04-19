import { useEffect, useMemo, useState } from 'react';
import { ratingsAPI } from '../api';
import { formatDateTime, formatRating, safeArray } from '../constants';
import { useAuthStore, useUIStore } from '../store';

export default function RatingsPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';

  const load = async () => {
    setLoading(true);
    try {
      const response = await ratingsAPI.getList({ ordering: '-ngay_tao' });
      setRatings(safeArray(response.data));
    } catch {
      showNotification('Khong the tai danh gia', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    average: ratings.length ? ratings.reduce((sum, item) => sum + Number(item.diem_tong_quat || 0), 0) / ratings.length : 0,
    pending: ratings.filter((item) => !item.da_duyet).length,
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

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Danh gia cong dong</div>
          <p className="page-subtitle">Khong con la trang placeholder. Day la bang kiem duyet va tong hop chat luong dich vu tai cong vien.</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-label">Diem trung binh</div><div className="stat-value">{formatRating(stats.average)}</div><div className="stat-meta">Theo tat ca phan hoi dang co</div></div>
        <div className="card stat-card"><div className="stat-label">Cho duyet</div><div className="stat-value">{stats.pending}</div><div className="stat-meta">Chi admin moi co quyen kiem duyet</div></div>
      </div>

      <section className="card section-card">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cong vien</th>
                  <th>Nguoi gui</th>
                  <th>Diem tong quat</th>
                  <th>Noi dung</th>
                  <th>Ngay tao</th>
                  <th>Duyet</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating.ma_danh_gia}>
                    <td>{rating.cong_vien_ten}</td>
                    <td>{rating.nguoi_dung_ten || 'Nguoi dung'}</td>
                    <td>{rating.diem_tong_quat || '-'}</td>
                    <td style={{ whiteSpace: 'normal' }}>{rating.noi_dung || 'Khong co nhan xet'}</td>
                    <td>{formatDateTime(rating.ngay_tao)}</td>
                    <td>
                      {isAdmin ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleModeration(rating.ma_danh_gia, true)}>Duyet</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleModeration(rating.ma_danh_gia, false)}>Tu choi</button>
                        </div>
                      ) : (rating.da_duyet ? 'Da duyet' : 'Cho duyet')}
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
