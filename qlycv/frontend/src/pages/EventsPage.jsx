import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../api';
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS, formatDateTime, hasAnyRole, PERMISSION_GROUPS, safeArray } from '../constants';
import { useAuthStore, useUIStore } from '../store';

export default function EventsPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = hasAnyRole(user, [PERMISSION_GROUPS.ADMIN]);
  const isManager = hasAnyRole(user, [PERMISSION_GROUPS.MANAGER]);
  const canManageEvents = hasAnyRole(user, [PERMISSION_GROUPS.MANAGER, PERMISSION_GROUPS.ADMIN]);
  const managedParkId = user?.ma_cong_vien ? String(user.ma_cong_vien) : '';

  const load = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getList({ ordering: 'thoi_gian_bat_dau' });
      setEvents(safeArray(response.data));
    } catch {
      showNotification('Khong the tai danh sach su kien', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    try {
      await eventsAPI.approve(id);
      showNotification('Da duyet su kien', 'success');
      load();
    } catch {
      showNotification('Khong the duyet su kien', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoa su kien nay?')) return;
    try {
      await eventsAPI.delete(id);
      showNotification('Da xoa su kien', 'success');
      load();
    } catch {
      showNotification('Khong the xoa su kien', 'error');
    }
  };

  const canManageEvent = (event) => {
    if (isAdmin) return true;
    if (!isManager) return false;
    return String(event.ma_cong_vien || event.cong_vien || '') === managedParkId;
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Lich su kien cong vien</div>
          <p className="page-subtitle">Guest va user co the xem lich su kien. Chi manager va admin moi duoc tao, sua, duyet hoac xoa su kien.</p>
        </div>
        {canManageEvents && <Link className="btn btn-primary" to="/events/create">Tao su kien</Link>}
      </div>

      <section className="card section-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Su kien</th>
                  <th>Cong vien</th>
                  <th>Loai</th>
                  <th>Bat dau</th>
                  <th>Trang thai</th>
                  <th>Phe duyet</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.ma_su_kien}>
                    <td><strong>{event.ten_su_kien}</strong></td>
                    <td>{event.cong_vien_ten}</td>
                    <td>{EVENT_TYPE_LABELS[event.loai_su_kien] || event.loai_su_kien}</td>
                    <td>{formatDateTime(event.thoi_gian_bat_dau)}</td>
                    <td>{EVENT_STATUS_LABELS[event.trang_thai] || event.trang_thai}</td>
                    <td>{event.da_duyet ? 'Da duyet' : 'Cho duyet'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(event.ma_cong_vien || event.cong_vien) && <Link className="btn btn-ghost btn-sm" to={`/parks/${event.ma_cong_vien || event.cong_vien}`}>Xem cong vien</Link>}
                        {isAdmin && !event.da_duyet && <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleApprove(event.ma_su_kien)}>Duyet</button>}
                        {canManageEvent(event) && <Link className="btn btn-primary btn-sm" to={`/events/${event.ma_su_kien}/edit`}>Sua</Link>}
                        {canManageEvent(event) && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(event.ma_su_kien)}>Xoa</button>}
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
