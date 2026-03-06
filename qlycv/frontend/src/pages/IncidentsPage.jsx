import { Link } from 'react-router-dom';
import '../styles/pages/PlaceholderPage.css';

export default function IncidentsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <h1>Báo Cáo Sự Cố</h1>
        <Link to="/" className="btn btn-primary">+ Báo Cáo Sự Cố</Link>
      </div>
      <div className="placeholder-content">
        <p>Trang báo cáo và xử lý sự cố công viên</p>
        <p>Quản lý các báo cáo: hư hỏng, ô nhiễm, an toàn, v.v.</p>
      </div>
    </div>
  );
}
