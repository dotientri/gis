import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import Footer from '../Footer/Footer';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <Header />
      <div className="main-layout-wrapper">
        <Sidebar />
        <main className="main-layout-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
