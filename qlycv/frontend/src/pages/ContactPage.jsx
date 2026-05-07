import ContactForm from '../components/ContactForm';

export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Lien he</div>
          <p className="page-subtitle">Gui noi dung can ho tro, hop tac hoac bao loi. He thong se luu thong tin nguoi gui de admin theo doi va phan hoi.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card section-card">
          <h2 style={{ marginTop: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Gui yeu cau lien he</h2>
          <ContactForm source="contact-page" />
        </section>

        <section className="card section-card">
          <h2 style={{ marginTop: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Lien he nhanh</h2>
          <div className="info-list">
            <div className="info-row">
              <span>Email</span>
              <strong><a href="mailto:dotientri0285@gmail.com">dotientri0285@gmail.com</a></strong>
            </div>
            <div className="info-row">
              <span>Phone</span>
              <strong><a href="tel:+84934884181">+84 934884181</a></strong>
            </div>
            <div className="info-row">
              <span>Gmail</span>
              <strong>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=dotientri0285@gmail.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mo Gmail de soan thu
                </a>
              </strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
