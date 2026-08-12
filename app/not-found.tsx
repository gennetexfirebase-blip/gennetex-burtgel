import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><span>404</span><h1>Хуудас олдсонгүй.</h1><Link href="/">Нүүр хуудас руу буцах</Link></main>;
}
