import { Link } from 'react-router-dom';
import '../styles/pages/NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-icon" aria-hidden="true">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <h1>404</h1>
        <p className="not-found-title">Trang không tồn tại</p>
        <p className="not-found-message">
          Không tìm thấy trang bạn đang truy cập. Hãy kiểm tra lại đường dẫn, hoặc quay về trang chính.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-large">
          ← Về Trang Chủ
        </Link>
      </div>
    </div>
  );
}
