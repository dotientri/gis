import { Link } from 'react-router-dom';
import '../styles/pages/PlaceholderPage.css';

export default function TreesPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <h1>Quản Lý Cây Xanh</h1>
        <Link to="/" className="btn btn-primary">+ Thêm Cây</Link>
      </div>
      <div className="placeholder-content">
        <p>Trang quản lý cây xanh trong công viên</p>
        <p>Theo dõi sức khỏe cây, loại cây, vị trí phân bố.</p>
      </div>
    </div>
  );
}
