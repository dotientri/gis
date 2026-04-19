import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentsAPI } from '../api';
import { INCIDENT_PRIORITY_LABELS, INCIDENT_STATUS_LABELS, formatDateTime, getStatusColor, safeArray } from '../constants';
import { useAuthStore, useUIStore } from '../store';

function getIncidentImages(item) {
  return Array.isArray(item?.url_hinh_anh) ? item.url_hinh_anh.filter(Boolean) : [];
}

function getIncidentLocation(item) {
  return Array.isArray(item?.vi_tri) && item.vi_tri.length >= 2 ? item.vi_tri : null;
}

export default function IncidentsPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isArchived, setIsArchived] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const canManage = ['QUAN_TRI', 'QUAN_LY'].includes(user?.nhom_quyen_code);
  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';

  const load = async (archived) => {
    setLoading(true);
    try {
      const response = await incidentsAPI.getList({ is_archived: archived, ordering: '-ngay_tao' });
      setIncidents(safeArray(response.data));
    } catch (error) {
      showNotification('Khong the tai danh sach su co', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(isArchived);
  }, [isArchived]);

  const summary = useMemo(() => ({
    urgent: incidents.filter((item) => item.muc_do_uu_tien === 'khan_cap').length,
    pending: incidents.filter((item) => item.trang_thai === 'cho_xu_ly').length,
    processing: incidents.filter((item) => item.trang_thai === 'dang_xu_ly').length,
  }), [incidents]);

  const handleStatusChange = async (id, status) => {
    try {
      await incidentsAPI.updateStatus(id, status);
      showNotification('Da cap nhat trang thai su co', 'success');
      load(isArchived);
    } catch (error) {
      showNotification(error.response?.data?.error || 'Khong the cap nhat trang thai', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const response = await incidentsAPI.exportExcel({ is_archived: isArchived });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `su-co-${isArchived ? 'luu-tru' : 'dang-xu-ly'}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showNotification('Khong the xuat Excel', 'error');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Trung tam xu ly su co</div>
          <p className="page-subtitle">Mot man hinh cho tiep nhan, phan loai, chuyen trang thai va xuat bao cao hien truong.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {canManage && <button type="button" className="btn btn-secondary" onClick={handleExport}>Xuat Excel</button>}
          <Link className="btn btn-primary" to="/incidents/create">Bao cao moi</Link>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card"><div className="stat-label">Tong su co</div><div className="stat-value">{incidents.length}</div><div className="stat-meta">Theo che do dang xem</div></div>
        <div className="card stat-card"><div className="stat-label">Cho xu ly</div><div className="stat-value">{summary.pending}</div><div className="stat-meta">{summary.processing} dang thao tac</div></div>
        <div className="card stat-card"><div className="stat-label">Muc khan cap</div><div className="stat-value">{summary.urgent}</div><div className="stat-meta">Can uu tien dieu phoI</div></div>
      </div>

      <section className="card section-card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Danh sach su co</h2>
            <p className="page-subtitle">Chuyen doi giua su co dang mo va kho luu tru sau khi da xu ly.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className={`btn btn-sm ${!isArchived ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setIsArchived(false)}>Dang xu ly</button>
            <button type="button" className={`btn btn-sm ${isArchived ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setIsArchived(true)}>Luu tru</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : incidents.length === 0 ? (
          <div className="empty-state"><p>Chua co su co nao trong nhom nay.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tieu de</th>
                  <th>Cong vien</th>
                  <th>Danh muc</th>
                  <th>Anh su co</th>
                  <th>Dinh vi</th>
                  <th>Uu tien</th>
                  <th>Trang thai</th>
                  <th>Thoi gian</th>
                  <th>Xu ly</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((item) => (
                  <tr key={item.ma_bao_cao}>
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong>{item.tieu_de}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{item.noi_dung_mo_ta?.slice(0, 88) || 'Khong co mo ta'}</span>
                      </div>
                    </td>
                    <td>{item.cong_vien_ten || 'N/A'}</td>
                    <td>{item.danh_muc_ten || 'N/A'}</td>
                    <td>
                      {getIncidentImages(item).length > 0 ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {getIncidentImages(item).slice(0, 2).map((imageUrl, index) => (
                            <button
                              key={`${item.ma_bao_cao}-${index}`}
                              type="button"
                              onClick={() => setPreviewImage({ url: imageUrl, title: item.tieu_de })}
                              style={{
                                width: 56,
                                height: 56,
                                padding: 0,
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: '1px solid rgba(148, 163, 184, 0.25)',
                                cursor: 'zoom-in',
                                background: '#fff',
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={item.tieu_de}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            </button>
                          ))}
                          {getIncidentImages(item).length > 2 && (
                            <span className="badge">+{getIncidentImages(item).length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>Khong co</span>
                      )}
                    </td>
                    <td>
                      {getIncidentLocation(item) ? (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <span style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
                            {getIncidentLocation(item)[0].toFixed(5)}, {getIncidentLocation(item)[1].toFixed(5)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${getIncidentLocation(item)[0]},${getIncidentLocation(item)[1]}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Xem ban do
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>Chua co</span>
                      )}
                    </td>
                    <td>
                      <span className="badge">
                        <span className="badge-dot" style={{ backgroundColor: getStatusColor(item.muc_do_uu_tien, 'priority') }} />
                        {INCIDENT_PRIORITY_LABELS[item.muc_do_uu_tien] || item.muc_do_uu_tien}
                      </span>
                    </td>
                    <td>
                      {canManage && !isArchived && (isAdmin || String(user?.ma_cong_vien) === String(item.ma_cong_vien)) ? (
                        <select value={item.trang_thai} onChange={(event) => handleStatusChange(item.ma_bao_cao, event.target.value)}>
                          {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="badge">
                          <span className="badge-dot" style={{ backgroundColor: getStatusColor(item.trang_thai, 'incident') }} />
                          {INCIDENT_STATUS_LABELS[item.trang_thai] || item.trang_thai}
                        </span>
                      )}
                    </td>
                    <td>{formatDateTime(item.ngay_tao)}</td>
                    <td>{item.nguoi_phu_trach_ten || (item.ma_nguoi_bao_cao ? 'Co nguoi bao cao' : 'An danh')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            className="surface"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(960px, 100%)',
              borderRadius: 24,
              overflow: 'hidden',
              background: '#0f172a',
              padding: 12,
              display: 'grid',
              gap: 12,
            }}
          >
            <img
              src={previewImage.url}
              alt={previewImage.title}
              style={{
                width: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: 16,
                background: 'rgba(15, 23, 42, 0.35)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', color: '#e2e8f0' }}>
              <div>{previewImage.title}</div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreviewImage(null)}>Dong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
