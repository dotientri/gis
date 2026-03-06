import { Link } from 'react-router-dom';
import '../styles/pages/PlaceholderPage.css';

export default function EventsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <h1>Quản Lý Sự Kiện</h1>
        <Link to="/" className="btn btn-primary">+ Tạo Sự Kiện</Link>
      </div>
      <div className="placeholder-content">
        <p>Trang quản lý các sự kiện công viên</p>
        <p>Quản lý lịch sự kiện, phê duyệt, thống kê lượng người tham dự.</p>
      </div>
    </div>
  );
}
