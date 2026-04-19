import { useEffect, useMemo, useState } from 'react';
import { treesAPI } from '../api';
import { TREE_HEALTH_LABELS, formatDateTime, safeArray } from '../constants';
import { useUIStore } from '../store';

export default function TreesPage() {
  const { showNotification } = useUIStore();
  const [trees, setTrees] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [treesResponse, statsResponse] = await Promise.all([
          treesAPI.getList({ ordering: '-ngay_cap_nhat' }),
          treesAPI.getStatistics(),
        ]);
        setTrees(safeArray(treesResponse.data));
        setStats(statsResponse.data || []);
      } catch {
        showNotification('Khong the tai du lieu cay xanh', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showNotification]);

  const summary = useMemo(() => trees.slice(0, 4), [trees]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Ho so cay xanh</div>
          <p className="page-subtitle">Man hinh nay da duoc noi voi API cay xanh de theo doi suc khoe, loai cay va cong vien phan bo.</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {stats.map((item) => (
          <div key={item.tinh_trang} className="card stat-card">
            <div className="stat-label">{TREE_HEALTH_LABELS[item.tinh_trang] || item.tinh_trang}</div>
            <div className="stat-value">{item.count}</div>
            <div className="stat-meta">Thong ke tinh trang cay</div>
          </div>
        ))}
      </div>

      <section className="card section-card">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ma cay</th>
                  <th>Cong vien</th>
                  <th>Loai cay</th>
                  <th>Tinh trang</th>
                  <th>Ngay cat tia</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((tree) => (
                  <tr key={tree.ma_cay}>
                    <td>{tree.ma_so_cay || `#${tree.ma_cay}`}</td>
                    <td>{tree.cong_vien_ten}</td>
                    <td>{tree.loai_cay_ten || 'N/A'}</td>
                    <td>{TREE_HEALTH_LABELS[tree.tinh_trang] || tree.tinh_trang}</td>
                    <td>{formatDateTime(tree.ngay_cat_tia_cuoi)}</td>
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
