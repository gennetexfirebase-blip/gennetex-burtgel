import Link from "next/link";
import RegistrationForm from "@/app/registration-form";

export default function Home() {
  return (
    <main className="registration-page">
      <section className="intro-panel">
        <Link className="brand" href="/" aria-label="Gennetex нүүр">
          <span className="brand-mark">G</span>
          <span>GENNETEX</span>
        </Link>
        <div className="intro-copy">
          <span className="eyebrow light">Нэгдсэн бүртгэл</span>
          <h1>Бидний түүхэнд өөрийн мөрийг нэмээрэй.</h1>
          <p>Мэдээллээ үнэн зөв бөглөж, тод нүүр зураг оруулна уу. Бүртгэл Google Sheet-д шууд хадгалагдана.</p>
        </div>
        <div className="intro-stat">
          <span className="live-dot" />
          Систем ажиллаж байна
        </div>
      </section>

      <section className="form-panel">
        <div className="form-shell">
          <div className="form-heading">
            <span className="eyebrow">Тавтай морил</span>
            <h2>Шинэ бүртгэл</h2>
            <p>Доорх мэдээллийг бөглөхөд нэг минут хангалттай.</p>
          </div>
          <RegistrationForm />
          <Link className="directory-link" href="/a">Бүртгэлтэй хүмүүсийг харах <span>→</span></Link>
        </div>
      </section>
    </main>
  );
}
