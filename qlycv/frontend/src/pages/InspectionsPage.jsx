import { Link } from 'react-router-dom';
import '../styles/pages/PlaceholderPage.css';

export default function InspectionsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <h1>Kiểm Tra Công Viên</h1>
        <Link to="/" className="btn btn-primary">+ Tạo Phiếu Kiểm Tra</Link>
      </div>
      <div className="placeholder-content">
        <p>Trang quản lý phiếu kiểm tra định kỳ</p>
        <p>Ghi nhận kết quả kiểm tra, nhu cầu bảo trì, nâng cấp.</p>
      </div>
    </div>
  );
}
