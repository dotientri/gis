import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-brand">
          <h1>🌳 Quản Lý Công Viên TP.HCM</h1>
          <p>Hệ Thống GIS Quản Lý Công Viên Cây Xanh</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
