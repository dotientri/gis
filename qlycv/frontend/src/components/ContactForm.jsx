import { useState } from 'react';
import { contactAPI } from '../api';
import { useAuthStore, useUIStore } from '../store';

const EMPTY_FORM = {
  ho_ten: '',
  email: '',
  so_dien_thoai: '',
  tieu_de: '',
  noi_dung: '',
};

function getApiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.error === 'string' && data.error) return data.error;
  if (typeof data.detail === 'string' && data.detail) return data.detail;

  const firstField = Object.values(data).find((value) => Array.isArray(value) ? value[0] : typeof value === 'string');
  if (Array.isArray(firstField) && firstField[0]) return firstField[0];
  if (typeof firstField === 'string' && firstField) return firstField;
  return fallback;
}

export default function ContactForm({ source = 'web', compact = false }) {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ho_ten: user?.ho_ten || user?.ten_dang_nhap || '',
    email: user?.email || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await contactAPI.submit({ ...form, nguon_truy_cap: source });
      showNotification(response.data?.warning || response.data?.message || 'Da gui yeu cau lien he', response.data?.warning ? 'info' : 'success');
      setForm({
        ...EMPTY_FORM,
        ho_ten: user?.ho_ten || user?.ten_dang_nhap || '',
        email: user?.email || '',
      });
    } catch (error) {
      showNotification(getApiErrorMessage(error, 'Khong the gui yeu cau lien he'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`contact-form${compact ? ' compact' : ''}`} onSubmit={handleSubmit}>
      <div className="contact-form-grid">
        <div className="form-group">
          <label>Ho ten</label>
          <input value={form.ho_ten} onChange={(event) => handleChange('ho_ten', event.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} required />
        </div>
      </div>

      <div className="contact-form-grid">
        <div className="form-group">
          <label>So dien thoai</label>
          <input value={form.so_dien_thoai} onChange={(event) => handleChange('so_dien_thoai', event.target.value)} />
        </div>
        <div className="form-group">
          <label>Tieu de</label>
          <input value={form.tieu_de} onChange={(event) => handleChange('tieu_de', event.target.value)} required />
        </div>
      </div>

      <div className="form-group">
        <label>Noi dung</label>
        <textarea rows={compact ? 3 : 6} value={form.noi_dung} onChange={(event) => handleChange('noi_dung', event.target.value)} required />
      </div>

      <div className="contact-form-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
          {submitting ? 'Dang gui...' : 'Gui lien he'}
        </button>
      </div>
    </form>
  );
}
