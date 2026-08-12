"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><span>!</span><h1>Уучлаарай, алдаа гарлаа.</h1><p>Хуудсыг дахин ачаалж оролдоно уу.</p><button onClick={reset}>Дахин оролдох</button></main>;
}
