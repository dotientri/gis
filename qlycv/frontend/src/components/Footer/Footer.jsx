import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Hệ Thống Quản Lý Công Viên TP.HCM. Tất cả quyền được bảo lưu.</p>
        <p>
          Phát triển bởi <strong>Ban Quản lý Công viên Cây xanh</strong> - UBND TP.HCM
        </p>
      </div>
    </footer>
  );
}
