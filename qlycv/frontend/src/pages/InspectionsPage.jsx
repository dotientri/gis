import { useEffect, useMemo, useState } from 'react';
import { inspectionsAPI, parksAPI } from '../api';
import { formatDateTime, safeArray } from '../constants';
import { useUIStore } from '../store';

export default function InspectionsPage() {
  const { showNotification } = useUIStore();
  const [inspections, setInspections] = useState([]);
  const [attentionParks, setAttentionParks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [inspectionsResponse, parksResponse] = await Promise.all([
          inspectionsAPI.getList({ ordering: '-ngay_kiem_tra' }),
          parksAPI.getParksNeedingInspection(),
        ]);
        setInspections(safeArray(inspectionsResponse.data));
        setAttentionParks(parksResponse.data || []);
      } catch {
        showNotification('Khong the tai du lieu kiem tra', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showNotification]);

  const recent = useMemo(() => inspections.slice(0, 8), [inspections]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Kiem tra cong vien</div>
          <p className="page-subtitle">Bang tong hop lich kiem tra dinh ky va danh sach cong vien dang can duoc xuong hien truong.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card section-card">
          <h2 style={{ marginTop: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Cong vien can kiem tra</h2>
          <div className="info-list">
            {attentionParks.length > 0 ? attentionParks.slice(0, 8).map((park) => (
              <div key={park.ma_cong_vien} className="notice">
                <strong>{park.ten_cong_vien}</strong>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>{park.quan_huyen_ten || 'N/A'}</div>
              </div>
            )) : <div className="empty-state"><p>Khong co cong vien nao qua han kiem tra.</p></div>}
          </div>
        </section>

        <section className="card section-card">
          <h2 style={{ marginTop: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Phieu kiem tra gan day</h2>
          {loading ? <div className="loading-container"><div className="spinner" /></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cong vien</th>
                    <th>Ngay</th>
                    <th>Ket qua</th>
                    <th>Diem</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((inspection) => (
                    <tr key={inspection.ma_kiem_tra}>
                      <td>{inspection.cong_vien_ten}</td>
                      <td>{formatDateTime(inspection.ngay_kiem_tra)}</td>
                      <td>{inspection.ket_qua || 'N/A'}</td>
                      <td>{inspection.diem_tong || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
