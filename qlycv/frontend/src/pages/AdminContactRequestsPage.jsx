import { useEffect, useState } from 'react';
import { adminAPI } from '../api';
import { formatDateTime, safeArray } from '../constants';
import { useUIStore } from '../store';

export default function AdminContactRequestsPage() {
  const { showNotification } = useUIStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processedOnly, setProcessedOnly] = useState(false);

  const load = async (nextProcessedOnly = processedOnly) => {
    setLoading(true);
    try {
      const response = await adminAPI.getContactRequests({
        ordering: '-ngay_tao',
        da_xu_ly: nextProcessedOnly ? 'true' : undefined,
      });
      setItems(safeArray(response.data));
    } catch {
      showNotification('Khong the tai danh sach lien he', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(processedOnly);
  }, [processedOnly]);

  const handleMarkProcessed = async (item) => {
    try {
      await adminAPI.markContactProcessed(item.ma_yeu_cau);
      showNotification('Da danh dau yeu cau la da xu ly', 'success');
      load(processedOnly);
    } catch {
      showNotification('Khong the cap nhat yeu cau lien he', 'error');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Lien he gui den admin</div>
          <p className="page-subtitle">Danh sach nguoi da gui form lien he, kem thong tin nguoi gui va noi dung can xu ly.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className={`btn ${processedOnly ? 'btn-ghost' : 'btn-primary'}`} onClick={() => setProcessedOnly(false)}>
            Chua xu ly
          </button>
          <button type="button" className={`btn ${processedOnly ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setProcessedOnly(true)}>
            Da xu ly
          </button>
        </div>
      </div>

      <section className="card section-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>Chua co yeu cau lien he nao trong nhom nay.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nguoi gui</th>
                  <th>Thong tin</th>
                  <th>Tieu de</th>
                  <th>Noi dung</th>
                  <th>Nguon</th>
                  <th>Thoi gian</th>
                  <th>Xu ly</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.ma_yeu_cau}>
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong>{item.ho_ten}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
                          {item.nguoi_dung_username || item.nguoi_dung_ten ? `${item.nguoi_dung_ten || ''} ${item.nguoi_dung_username ? `(${item.nguoi_dung_username})` : ''}`.trim() : 'Khach chua dang nhap'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <a href={`mailto:${item.email}`}>{item.email}</a>
                        {item.so_dien_thoai ? <a href={`tel:${item.so_dien_thoai}`}>{item.so_dien_thoai}</a> : <span style={{ color: 'var(--muted)' }}>Khong co so dien thoai</span>}
                      </div>
                    </td>
                    <td>{item.tieu_de}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: 280 }}>{item.noi_dung}</td>
                    <td>{item.nguon_truy_cap || 'N/A'}</td>
                    <td>{formatDateTime(item.ngay_tao)}</td>
                    <td>
                      {item.da_xu_ly ? (
                        <span className="badge">Da xu ly</span>
                      ) : (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleMarkProcessed(item)}>
                          Danh dau da xu ly
                        </button>
                      )}
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
