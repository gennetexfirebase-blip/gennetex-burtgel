"use client";

import Image from "next/image";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Registration } from "@/lib/types";

export default function Directory({
  initialRegistrations,
  initialError,
}: {
  initialRegistrations: Registration[];
  initialError: string;
}) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [error, setError] = useState(initialError);
  const [toast, setToast] = useState("");
  const knownIds = useRef(new Set(initialRegistrations.map((item) => item.id)));

  useEffect(() => {
    async function refresh() {
      try {
        const response = await fetch("/api/registrations", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        const latest = result.registrations as Registration[];
        const added = latest.filter((item) => !knownIds.current.has(item.id));
        if (added.length) {
          added.forEach((item) => knownIds.current.add(item.id));
          const message = `${added[0].lastName} ${added[0].firstName} шинээр бүртгүүллээ.`;
          setToast(message);
          window.setTimeout(() => setToast(""), 5000);
          if (Notification.permission === "granted") new Notification("Шинэ бүртгэл", { body: message });
        }
        setRegistrations(latest);
        setError("");
      } catch {
        setError("Мэдээлэл шинэчилж чадсангүй. Дахин оролдож байна...");
      }
    }

    const timer = window.setInterval(refresh, 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const term = deferredQuery.trim().toLocaleLowerCase("mn-MN");
    if (!term) return registrations;
    return registrations.filter((item) =>
      [item.lastName, item.firstName, item.role, item.email, item.phone, item.address]
        .join(" ")
        .toLocaleLowerCase("mn-MN")
        .includes(term),
    );
  }, [deferredQuery, registrations]);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setToast("Энэ browser мэдэгдэл дэмжихгүй байна.");
      return;
    }
    const permission = await Notification.requestPermission();
    setToast(permission === "granted" ? "Browser мэдэгдэл асаалаа." : "Мэдэгдлийн зөвшөөрөл өгөгдсөнгүй.");
    window.setTimeout(() => setToast(""), 4000);
  }

  return (
    <section className="directory-content">
      <div className="directory-tools">
        <div className="search-box">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Нэр, утас, эрхээр хайх..." aria-label="Бүртгэлээс хайх" />
        </div>
        <button className="notification-button" type="button" onClick={enableNotifications}>Мэдэгдэл асаах</button>
        <span className="people-count"><strong>{filtered.length}</strong> хүн</span>
      </div>

      {error && <div className="directory-error" role="alert">{error}</div>}
      {filtered.length ? (
        <div className="people-grid">
          {filtered.map((person) => (
            <article className="person-card" key={person.id}>
              <div className="person-photo">
                {person.photo ? (
                  <Image src={person.photo} alt={`${person.lastName} ${person.firstName}`} fill sizes="(max-width: 700px) 100vw, 300px" unoptimized />
                ) : (
                  <span>{person.firstName.slice(0, 1) || person.lastName.slice(0, 1) || "G"}</span>
                )}
                <small>{person.role}</small>
              </div>
              <div className="person-info">
                <h2>{person.lastName} {person.firstName}</h2>
                {person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}
                {person.phone && <a href={`tel:${person.phone.replace(/\s/g, "")}`}>{person.phone}</a>}
                {person.address && <p>{person.address}</p>}
                {person.createdAt && <time>{person.createdAt}</time>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><span>G</span><h2>Бүртгэл олдсонгүй</h2><p>Хайлтын үгээ өөрчлөх эсвэл шинээр хүн бүртгэнэ үү.</p></div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}
