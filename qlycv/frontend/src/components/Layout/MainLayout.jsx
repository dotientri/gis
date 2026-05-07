import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <Header />
      <div className="main-layout-wrapper">
        <Sidebar />
        <div className="main-layout-content-shell">
          <main className="main-layout-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
