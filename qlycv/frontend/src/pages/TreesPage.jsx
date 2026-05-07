import { useEffect, useMemo, useState } from 'react';
import { parksAPI, treesAPI } from '../api';
import { TREE_HEALTH_LABELS, formatDate, getStatusColor, safeArray } from '../constants';
import { useAuthStore, useUIStore } from '../store';

const EMPTY_FORM = {
  ma_cay: null,
  ma_cong_vien: '',
  ma_loai_cay: '',
  ma_so_cay: '',
  so_luong: '1',
  chieu_cao_m: '',
  duong_kinh_cm: '',
  ban_kinh_tan_m: '',
  tinh_trang: 'tot',
  ngay_trong: '',
  ngay_cat_tia_cuoi: '',
};

const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === 'string' && data.detail) return data.detail;

  const firstField = Object.values(data).find((value) => Array.isArray(value) ? value[0] : typeof value === 'string');
  if (Array.isArray(firstField) && firstField[0]) return firstField[0];
  if (typeof firstField === 'string' && firstField) return firstField;
  return fallback;
};

export default function TreesPage() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [trees, setTrees] = useState([]);
  const [stats, setStats] = useState([]);
  const [parks, setParks] = useState([]);
  const [treeTypes, setTreeTypes] = useState([]);
  const [filters, setFilters] = useState({
    ma_cong_vien: user?.ma_cong_vien ? String(user.ma_cong_vien) : '',
    tinh_trang: '',
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.nhom_quyen_code === 'QUAN_TRI';
  const isManager = user?.nhom_quyen_code === 'QUAN_LY';
  const managedParkId = user?.ma_cong_vien ? String(user.ma_cong_vien) : '';
  const canManageTrees = isAdmin || isManager;
  const isEditing = Boolean(form.ma_cay);

  useEffect(() => {
    const loadMeta = async () => {
      setMetaLoading(true);
      try {
        const [parksResponse, typesResponse, statsResponse] = await Promise.all([
          parksAPI.getList({ limit: 200 }),
          treesAPI.getTypes(),
          treesAPI.getStatistics(),
        ]);
        const parkList = safeArray(parksResponse.data);
        setParks(isManager ? parkList.filter((park) => String(park.ma_cong_vien) === managedParkId) : parkList);
        setTreeTypes(safeArray(typesResponse.data));
        setStats(statsResponse.data || []);
      } catch {
        showNotification('Khong the tai danh muc cay xanh', 'error');
      } finally {
        setMetaLoading(false);
      }
    };

    loadMeta();
  }, [isManager, managedParkId, showNotification]);

  useEffect(() => {
    if (isManager && managedParkId) {
      setFilters((current) => ({ ...current, ma_cong_vien: managedParkId }));
      setForm((current) => ({ ...current, ma_cong_vien: current.ma_cong_vien || managedParkId }));
    }
  }, [isManager, managedParkId]);

  useEffect(() => {
    const loadTrees = async () => {
      setLoading(true);
      try {
        const response = await treesAPI.getList({
          ordering: '-ngay_cap_nhat',
          ma_cong_vien: filters.ma_cong_vien || undefined,
          tinh_trang: filters.tinh_trang || undefined,
        });
        setTrees(safeArray(response.data));
      } catch {
        showNotification('Khong the tai du lieu cay xanh', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadTrees();
  }, [filters, showNotification]);

  const summaryCards = useMemo(() => {
    const total = trees.length;
    const needsCare = trees.filter((tree) => ['kem', 'chet'].includes(tree.tinh_trang)).length;
    const trimmed = trees.filter((tree) => tree.ngay_cat_tia_cuoi).length;

    return [
      { label: 'Tong cay hien thi', value: total, meta: 'Theo bo loc hien tai' },
      { label: 'Can cham soc', value: needsCare, meta: 'Tinh trang kem hoac chet' },
      { label: 'Da co lich cat tia', value: trimmed, meta: 'Co ngay cat tia gan nhat' },
    ];
  }, [trees]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, ma_cong_vien: isManager ? managedParkId : filters.ma_cong_vien });
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (tree) => {
    if (isManager && String(tree.ma_cong_vien) !== managedParkId) {
      showNotification('Manager chi duoc sua cay trong cong vien duoc gan', 'error');
      return;
    }

    setForm({
      ma_cay: tree.ma_cay,
      ma_cong_vien: tree.ma_cong_vien ? String(tree.ma_cong_vien) : '',
      ma_loai_cay: tree.ma_loai_cay ? String(tree.ma_loai_cay) : '',
      ma_so_cay: tree.ma_so_cay || '',
      so_luong: '1',
      chieu_cao_m: tree.chieu_cao_m || '',
      duong_kinh_cm: tree.duong_kinh_cm || '',
      ban_kinh_tan_m: tree.ban_kinh_tan_m || '',
      tinh_trang: tree.tinh_trang || 'tot',
      ngay_trong: tree.ngay_trong || '',
      ngay_cat_tia_cuoi: tree.ngay_cat_tia_cuoi || '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManageTrees) return;
    if (!form.ma_cong_vien || !form.ma_loai_cay) {
      showNotification('Vui long chon cong vien va loai cay', 'error');
      return;
    }

    if (isManager && String(form.ma_cong_vien) !== managedParkId) {
      showNotification('Manager chi duoc quan ly cay trong cong vien duoc gan', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ma_cong_vien: form.ma_cong_vien,
        ma_loai_cay: form.ma_loai_cay,
        ma_so_cay: isEditing ? (form.ma_so_cay || null) : null,
        chieu_cao_m: numberOrNull(form.chieu_cao_m),
        duong_kinh_cm: numberOrNull(form.duong_kinh_cm),
        ban_kinh_tan_m: numberOrNull(form.ban_kinh_tan_m),
        tinh_trang: form.tinh_trang,
        ngay_trong: form.ngay_trong || null,
        ngay_cat_tia_cuoi: form.ngay_cat_tia_cuoi || null,
        vi_tri: [],
      };

      if (isEditing) {
        const response = await treesAPI.update(form.ma_cay, payload);
        setTrees((current) => current.map((item) => (item.ma_cay === form.ma_cay ? response.data : item)));
      } else {
        const quantity = Math.max(1, Number.parseInt(form.so_luong, 10) || 1);
        const createdTrees = [];

        for (let index = 0; index < quantity; index += 1) {
          const response = await treesAPI.create({
            ...payload,
            ma_so_cay: quantity === 1 ? payload.ma_so_cay : null,
          });
          createdTrees.push(response.data);
        }

        setTrees((current) => [...createdTrees.reverse(), ...current]);
      }
      showNotification(isEditing ? 'Da cap nhat cay xanh' : 'Da them cay xanh', 'success');
      resetForm();
    } catch (error) {
      showNotification(getApiErrorMessage(error, 'Khong the luu cay xanh'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tree) => {
    if (!window.confirm('Xoa cay xanh nay?')) return;
    if (isManager && String(tree.ma_cong_vien) !== managedParkId) {
      showNotification('Manager chi duoc xoa cay trong cong vien duoc gan', 'error');
      return;
    }

    try {
      await treesAPI.delete(tree.ma_cay);
      setTrees((current) => current.filter((item) => item.ma_cay !== tree.ma_cay));
      if (form.ma_cay === tree.ma_cay) resetForm();
      showNotification('Da xoa cay xanh', 'success');
    } catch {
      showNotification('Khong the xoa cay xanh', 'error');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Quan ly cay xanh</div>
          <p className="page-subtitle">Theo doi ho so, suc khoe, lich trong va lich cat tia cay xanh theo tung cong vien.</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {summaryCards.map((item) => (
          <div key={item.label} className="card stat-card">
            <div className="stat-label">{item.label}</div>
            <div className="stat-value">{item.value}</div>
            <div className="stat-meta">{item.meta}</div>
          </div>
        ))}
        <div className="card stat-card">
          <div className="stat-label">Thong ke suc khoe</div>
          <div className="stat-value">{stats.reduce((total, item) => total + Number(item.count || 0), 0)}</div>
          <div className="stat-meta">Tong cay trong he thong</div>
        </div>
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
              {parks.map((park) => (
                <option key={park.ma_cong_vien} value={park.ma_cong_vien}>{park.ten_cong_vien}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tinh trang</label>
            <select value={filters.tinh_trang} onChange={(event) => setFilters((current) => ({ ...current, tinh_trang: event.target.value }))}>
              <option value="">Tat ca tinh trang</option>
              {Object.entries(TREE_HEALTH_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {canManageTrees && (
        <section className="card section-card" style={{ marginBottom: 24 }}>
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>{isEditing ? 'Sua cay xanh' : 'Them cay xanh'}</h2>
              <p className="page-subtitle">Nhap thong tin dinh danh va chi so sinh truong cua cay.</p>
            </div>
            {isEditing && <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>Huy sua</button>}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Cong vien *</label>
                <select value={form.ma_cong_vien} onChange={(event) => handleChange('ma_cong_vien', event.target.value)} disabled={isManager || metaLoading} required>
                  <option value="">-- Chon cong vien --</option>
                  {parks.map((park) => (
                    <option key={park.ma_cong_vien} value={park.ma_cong_vien}>{park.ten_cong_vien}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Loai cay *</label>
                <select value={form.ma_loai_cay} onChange={(event) => handleChange('ma_loai_cay', event.target.value)} disabled={metaLoading} required>
                  <option value="">-- Chon loai cay --</option>
                  {treeTypes.map((type) => (
                    <option key={type.ma_loai_cay} value={type.ma_loai_cay}>{type.ten_loai}</option>
                  ))}
                </select>
              </div>
              {!isEditing && (
                <div className="form-group">
                  <label>So luong</label>
                  <input type="number" min="1" value={form.so_luong} onChange={(event) => handleChange('so_luong', event.target.value)} />
                  <small>Ma cay se do he thong tu sinh.</small>
                </div>
              )}
              {isEditing && (
                <div className="form-group">
                  <label>Ma so cay</label>
                  <input value={form.ma_so_cay} onChange={(event) => handleChange('ma_so_cay', event.target.value)} placeholder={`#${form.ma_cay || ''}`} />
                </div>
              )}
              <div className="form-group">
                <label>Tinh trang</label>
                <select value={form.tinh_trang} onChange={(event) => handleChange('tinh_trang', event.target.value)}>
                  {Object.entries(TREE_HEALTH_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Chieu cao (m)</label>
                <input type="number" min="0" step="0.01" value={form.chieu_cao_m} onChange={(event) => handleChange('chieu_cao_m', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Duong kinh (cm)</label>
                <input type="number" min="0" step="0.01" value={form.duong_kinh_cm} onChange={(event) => handleChange('duong_kinh_cm', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Ban kinh tan (m)</label>
                <input type="number" min="0" step="0.01" value={form.ban_kinh_tan_m} onChange={(event) => handleChange('ban_kinh_tan_m', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Ngay trong</label>
                <input type="date" value={form.ngay_trong} onChange={(event) => handleChange('ngay_trong', event.target.value)} />
              </div>
              <div className="form-group">
                <label>Ngay cat tia cuoi</label>
                <input type="date" value={form.ngay_cat_tia_cuoi} onChange={(event) => handleChange('ngay_cat_tia_cuoi', event.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>Lam moi</button>
              <button type="submit" className="btn btn-primary" disabled={saving || metaLoading}>
                {saving ? 'Dang luu...' : isEditing ? 'Cap nhat cay' : 'Them cay'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card section-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Dang tai cay xanh...</p></div>
        ) : trees.length === 0 ? (
          <div className="empty-state"><p>Chua co cay xanh nao theo bo loc hien tai.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ma cay</th>
                  <th>Cong vien</th>
                  <th>Loai cay</th>
                  <th>Tinh trang</th>
                  <th>Chi so</th>
                  <th>Ngay trong</th>
                  <th>Cat tia cuoi</th>
                  {canManageTrees && <th>Thao tac</th>}
                </tr>
              </thead>
              <tbody>
                {trees.map((tree) => (
                  <tr key={tree.ma_cay}>
                    <td>{tree.ma_so_cay || `#${tree.ma_cay}`}</td>
                    <td>{tree.cong_vien_ten}</td>
                    <td>{tree.loai_cay_ten || 'N/A'}</td>
                    <td>
                      <span className="badge" style={{ background: `${getStatusColor(tree.tinh_trang, 'tree')}22`, color: getStatusColor(tree.tinh_trang, 'tree') }}>
                        {TREE_HEALTH_LABELS[tree.tinh_trang] || tree.tinh_trang}
                      </span>
                    </td>
                    <td>{tree.chieu_cao_m || '-'} m / {tree.duong_kinh_cm || '-'} cm</td>
                    <td>{formatDate(tree.ngay_trong)}</td>
                    <td>{formatDate(tree.ngay_cat_tia_cuoi)}</td>
                    {canManageTrees && (
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleEdit(tree)}>Sua</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(tree)}>Xoa</button>
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
