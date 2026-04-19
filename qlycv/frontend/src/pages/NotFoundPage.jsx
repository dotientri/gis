import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-shell not-found-shell">
      <section className="card not-found-hero">
        <div className="not-found-copy">
          <span className="landing-kicker">Dieu huong loi</span>
          <div className="not-found-code">404</div>
          <h1 className="page-title">Trang ban tim khong ton tai</h1>
          <p className="page-subtitle">
            Duong dan nay co the da thay doi, bi xoa hoac chua duoc kich hoat trong he thong quan ly cong vien.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              Ve bai viet
            </Link>
            <Link to="/parks" className="btn btn-ghost">
              Mo ban do cong vien
            </Link>
          </div>
        </div>

        <div className="surface not-found-panel">
          <div className="not-found-panel-head">
            <span className="badge">Khuyen nghi</span>
            <strong>Khu vuc kha dung</strong>
          </div>
          <div className="not-found-links">
            <Link to="/articles" className="notice not-found-link-card">
              <strong>Bai viet cong vien</strong>
              <span>Xem cac bai gioi thieu va anh noi bat.</span>
            </Link>
            <Link to="/parks" className="notice not-found-link-card">
              <strong>Ban do cong vien</strong>
              <span>Tim cong vien, xem ranh gioi va chi duong.</span>
            </Link>
            <Link to="/parks-list" className="notice not-found-link-card">
              <strong>Danh sach cong vien</strong>
              <span>Tra cuu nhanh theo ten, quan huyen va trang thai.</span>
            </Link>
            <Link to="/events" className="notice not-found-link-card">
              <strong>Su kien</strong>
              <span>Theo doi cac hoat dong dang va sap dien ra.</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
