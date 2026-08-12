import Link from "next/link";
import Directory from "@/app/a/directory";
import { getRegistrations } from "@/lib/sheets";
import type { Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  let registrations: Registration[] = [];
  let error = "";
  try {
    registrations = await getRegistrations();
  } catch {
    error = "Google Sheet-ээс мэдээлэл уншиж чадсангүй.";
  }

  return (
    <main className="directory-page">
      <header className="directory-header">
        <Link className="brand dark" href="/">
          <span className="brand-mark">G</span>
          <span>GENNETEX</span>
        </Link>
        <Link className="new-registration" href="/">+ Шинээр бүртгэх</Link>
      </header>
      <section className="directory-hero">
        <span className="eyebrow">Хүмүүс</span>
        <h1>Бүртгэлтэй хүмүүс</h1>
        <p>Google Sheet-д хадгалагдсан бүртгэл бодит хугацаанд шинэчлэгдэнэ.</p>
      </section>
      <Directory initialRegistrations={registrations} initialError={error} />
    </main>
  );
}
