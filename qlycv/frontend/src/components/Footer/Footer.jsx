import './Footer.css';
import ContactForm from '../ContactForm';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content surface">
        <div className="footer-brand">
          <span className="footer-badge">GIS PARKS</span>
          <strong>He thong quan ly cong vien TP.HCM</strong>
          <p>Theo doi cong vien, su co, tien ich va du lieu GIS tren mot giao dien gon, ro va de thao tac.</p>
        </div>
        <div className="footer-block">
          <strong>Thong tin lien he</strong>
          <p>Email: <a href="mailto:dotientri0285@gmail.com">dotientri0285@gmail.com</a></p>
          <p>Phone: <a href="tel:+84934884181">+84 934884181</a></p>
          <p>&copy; {currentYear}</p>
        </div>
        <div className="footer-block">
          <strong>Ho tro nhanh</strong>
          <p>Gui yeu cau lien he ngay trong footer de admin theo doi va phan hoi.</p>
          <p>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=dotientri0285@gmail.com"
              target="_blank"
              rel="noreferrer"
            >
              Mo Gmail de gui thu
            </a>
          </p>
        </div>
      </div>
      <div className="footer-contact-card">
        <div className="footer-contact-copy">
          <strong>Gui lien he nhanh</strong>
          <p>He thong se luu lai thong tin nguoi gui de admin theo doi va phan hoi.</p>
        </div>
        <ContactForm source="footer" compact />
      </div>
    </footer>
  );
}
