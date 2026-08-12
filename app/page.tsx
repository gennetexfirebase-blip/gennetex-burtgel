import Link from "next/link";
import RegistrationForm from "@/app/registration-form";

export default function Home() {
  return (
    <main className="registration-page">
      <div className="background-bubbles" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>

      <Link className="brand page-brand" href="/" aria-label="Gennetex нүүр">
        <span className="brand-mark">G</span>
        <span>GENNETEX</span>
      </Link>

      <div className="auth-deck">
        <section className="welcome-card">
          <span className="corner-bubble top" aria-hidden="true" />
          <span className="corner-bubble bottom" aria-hidden="true" />
          <div className="welcome-visual" aria-hidden="true">
            <span className="visual-orbit" />
            <span className="visual-g">G</span>
            <span className="visual-dot one" />
            <span className="visual-dot two" />
          </div>
          <span className="welcome-kicker">Gennetex бүртгэл</span>
          <h1>Тавтай морил</h1>
          <p>Манай нэгдсэн бүртгэлд өөрийн мэдээлэл, зургаа нэмээрэй.</p>
          <Link className="welcome-button" href="#register">Эхлэх</Link>
        </section>

        <section className="signup-card" id="register">
          <div className="signup-card-header">
            <span className="mini-logo">G</span>
            <h2>Бүртгүүлэх</h2>
            <p>Мэдээллээ үнэн зөв бөглөнө үү</p>
          </div>
          <div className="signup-card-body">
            <RegistrationForm />
          </div>
        </section>
      </div>

      <div className="system-status"><span className="live-dot" /> Систем ажиллаж байна</div>
    </main>
  );
}
