import { Link } from 'react-router-dom';
import '../styles/pages/NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1>404</h1>
        <p className="not-found-title">Không Tìm Thấy Trang</p>
        <p className="not-found-message">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-large">
          ← Quay Lại Trang Chủ
        </Link>
      </div>
    </div>
  );
}
