import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, eventsAPI, incidentsAPI, parksAPI } from '../api';
import { formatArea, formatDateTime, formatRating, safeArray } from '../constants';
import { useAuthStore, useUIStore } from '../store';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [stats, setStats] = useState(null);
  const [park, setPark] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const tasks = [incidentsAPI.getList({ limit: 6, ordering: '-ngay_tao' }), eventsAPI.getList({ limit: 6, ordering: '-thoi_gian_bat_dau' })];

        if (user?.nhom_quyen_code === 'QUAN_TRI') {
          tasks.unshift(dashboardAPI.getStatistics());
        }

        if (user?.ma_cong_vien) {
          tasks.push(parksAPI.getDetail(user.ma_cong_vien));
        }

        const responses = await Promise.all(tasks);
        let cursor = 0;

        if (user?.nhom_quyen_code === 'QUAN_TRI') {
          setStats(responses[cursor].data);
          cursor += 1;
        }

        setIncidents(safeArray(responses[cursor].data));
        cursor += 1;
        setEvents(safeArray(responses[cursor].data));
        cursor += 1;

        if (user?.ma_cong_vien) {
          setPark(responses[cursor].data);
        }
      } catch (error) {
        showNotification('Khong the tai du lieu dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showNotification, user?.ma_cong_vien, user?.nhom_quyen_code]);

  const cards = useMemo(() => {
    if (user?.nhom_quyen_code === 'QUAN_TRI') {
      return [
        { label: 'Cong vien hoat dong', value: stats?.tong_cong_vien ?? '-', meta: 'Cap nhat tu dashboard he thong' },
        { label: 'Can kiem tra', value: stats?.cong_vien_can_kiem_tra ?? '-', meta: 'Cong vien qua han 30 ngay' },
        { label: 'Su co cho xu ly', value: stats?.baocao_su_co_cho_xu_ly ?? '-', meta: 'Uu tien xu ly ngay' },
        { label: 'Tong cay xanh', value: stats?.tong_cay_xanh ?? '-', meta: `${stats?.cay_benh ?? 0} cay can chu y` },
      ];
    }

    return [
      { label: 'Cong vien duoc giao', value: park?.ten_cong_vien || 'Chua gan', meta: park?.quan_huyen_ten || 'Can admin phan cong' },
      { label: 'Dien tich', value: formatArea(park?.dien_tich_m2), meta: 'Tong quy mo van hanh' },
      { label: 'Diem danh gia', value: formatRating(park?.diem_trung_binh), meta: `${park?.so_luot_danh_gia || 0} luot danh gia` },
      { label: 'Su co mo', value: incidents.filter((item) => item.trang_thai !== 'da_xu_ly').length, meta: 'Can phan loai va dieu phoI' },
    ];
  }, [incidents, park, stats, user?.nhom_quyen_code]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Dieu hanh cong vien</div>
          <p className="page-subtitle">
            Giao dien moi tap trung vao ba luong cong viec: theo doi tai san, xu ly hien truong va ra quyet dinh nhanh.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/incidents/create">Bao cao su co</Link>
          <Link className="btn btn-ghost" to="/parks">Mo ban do</Link>
        </div>
      </div>

      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Dai ban thong tin da duoc tai thiet ke theo vai tro</h2>
        <p style={{ marginBottom: 0 }}>
          {user?.nhom_quyen_code === 'QUAN_TRI'
            ? 'Admin nhin ngay tinh trang he thong, tai nguyen va nghiep vu treo.'
            : 'Manager co mot trang bat dau duy nhat de xu ly cong vien duoc giao.'}
        </p>
      </div>

      {loading ? (
        <div className="loading-container card"><div className="spinner" /></div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {cards.map((card) => (
              <div key={card.label} className="card stat-card">
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-meta">{card.meta}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <section className="card section-card">
              <div className="page-header" style={{ marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Su co moi nhat</h2>
                  <p className="page-subtitle">Danh sach uu tien can giai quyet.</p>
                </div>
                <Link to="/incidents" className="btn btn-ghost btn-sm">Xem tat ca</Link>
              </div>
              <div className="info-list">
                {incidents.length > 0 ? incidents.slice(0, 5).map((item) => (
                  <div key={item.ma_bao_cao} className="notice">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                      <strong>{item.tieu_de}</strong>
                      <span className="badge">{item.trang_thai}</span>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>{item.cong_vien_ten || 'Khong ro cong vien'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: 6 }}>{formatDateTime(item.ngay_tao)}</div>
                  </div>
                )) : <div className="empty-state"><p>Chua co su co nao.</p></div>}
              </div>
            </section>

            <section className="card section-card">
              <div className="page-header" style={{ marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Su kien sap toi</h2>
                  <p className="page-subtitle">Ho tro dieu do, thong bao va duyet lich.</p>
                </div>
                <Link to="/events" className="btn btn-ghost btn-sm">Quan ly</Link>
              </div>
              <div className="info-list">
                {events.length > 0 ? events.slice(0, 5).map((item) => (
                  <div key={item.ma_su_kien} className="notice">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                      <strong>{item.ten_su_kien}</strong>
                      <span className="badge">{item.trang_thai}</span>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>{item.cong_vien_ten}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: 6 }}>{formatDateTime(item.thoi_gian_bat_dau)}</div>
                  </div>
                )) : <div className="empty-state"><p>Chua co su kien nao.</p></div>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
