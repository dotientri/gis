import { Link } from 'react-router-dom';
import '../styles/pages/PlaceholderPage.css';

export default function RatingsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <h1>Đánh Giá Công Viên</h1>
        <Link to="/" className="btn btn-primary">+ Thêm Đánh Giá</Link>
      </div>
      <div className="placeholder-content">
        <p>Trang quản lý đánh giá từ cộng đồng</p>
        <p>Xem, duyệt, quản lý các đánh giá và nhận xét.</p>
      </div>
    </div>
  );
}
