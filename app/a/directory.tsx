"use client";

import Image from "next/image";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Registration } from "@/lib/types";

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15">
      <rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ContactField({
  label,
  value,
  href,
  onCopy,
}: {
  label: string;
  value: string;
  href?: string;
  onCopy: () => void;
}) {
  return (
    <div className="contact-field">
      <div className="contact-field-copy">
        <span>{label}</span>
        {href ? <a href={href}>{value || "—"}</a> : <strong>{value || "—"}</strong>}
      </div>
      <button type="button" onClick={onCopy} disabled={!value} aria-label={label + " хуулах"} title={label + " хуулах"}>
        <CopyIcon />
      </button>
    </div>
  );
}

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
  const [deletingId, setDeletingId] = useState("");
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

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  async function copyText(value: string, label: string) {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = value;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        document.execCommand("copy");
        temporary.remove();
      }
      showToast(label + " хуулагдлаа.");
    } catch {
      showToast(label + " хуулж чадсангүй.");
    }
  }

  async function copyPhoto(photo: string, fullName: string) {
    if (!photo) return;
    try {
      const image = new window.Image();
      image.src = photo;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image load failed"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(image, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Image clipboard unavailable");
      }

      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast(fullName + "-ийн зураг хуулагдлаа.");
    } catch {
      showToast("Зураг хуулах боломжгүй байна. Chrome browser болон HTTPS ашиглана уу.");
    }
  }

  function copyContact(person: Registration) {
    const contact = [
      "Овог: " + (person.lastName || "—"),
      "Нэр: " + (person.firstName || "—"),
      "Утас: " + (person.phone || "—"),
      "Имэйл: " + (person.email || "—"),
      "Хаяг: " + (person.address || "—"),
      "Эрх: " + (person.role || "Ажилтан"),
    ].join("\n");
    void copyText(contact, "Бүх мэдээлэл");
  }

  async function removeContact(person: Registration) {
    const fullName = (person.lastName + " " + person.firstName).trim();
    if (!window.confirm(fullName + "-ийн бүртгэлийг Google Sheet-ээс бүрмөсөн устгах уу?")) return;
    const pin = window.prompt("Устгах админ PIN оруулна уу:");
    if (!pin) return;

    setDeletingId(person.id);
    try {
      const response = await fetch("/api/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: person.id, pin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Бүртгэл устгаж чадсангүй.");
      setRegistrations((current) => current.filter((item) => item.id !== person.id));
      knownIds.current.delete(person.id);
      showToast(fullName + " Sheet болон жагсаалтаас устлаа.");
    } catch (deleteError) {
      showToast(deleteError instanceof Error ? deleteError.message : "Бүртгэл устгаж чадсангүй.");
    } finally {
      setDeletingId("");
    }
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
                {person.photo ? (
                  <button
                    className="copy-photo-button"
                    type="button"
                    onClick={() => void copyPhoto(person.photo, person.lastName + " " + person.firstName)}
                  >
                    <CopyIcon />
                    Зураг хуулах
                  </button>
                ) : null}
              </div>
              <div className="person-info">
                <div className="contact-heading">
                  <div>
                    <span>Контакт</span>
                    <h2>{person.lastName} {person.firstName}</h2>
                  </div>
                  <button type="button" onClick={() => copyContact(person)} aria-label="Бүх мэдээллийг хуулах" title="Бүх мэдээллийг хуулах">
                    <CopyIcon />
                  </button>
                </div>
                <div className="contact-fields">
                  <ContactField label="Овог" value={person.lastName} onCopy={() => void copyText(person.lastName, "Овог")} />
                  <ContactField label="Нэр" value={person.firstName} onCopy={() => void copyText(person.firstName, "Нэр")} />
                  <ContactField
                    label="Утасны дугаар"
                    value={person.phone}
                    href={person.phone ? "tel:" + person.phone.replace(/\s/g, "") : undefined}
                    onCopy={() => void copyText(person.phone, "Утасны дугаар")}
                  />
                  <ContactField
                    label="Имэйл"
                    value={person.email}
                    href={person.email ? "mailto:" + person.email : undefined}
                    onCopy={() => void copyText(person.email, "Имэйл")}
                  />
                  <ContactField label="Хаяг" value={person.address} onCopy={() => void copyText(person.address, "Хаяг")} />
                </div>
                <div className="contact-actions">
                  <button className="copy-contact-button" type="button" onClick={() => copyContact(person)}>
                    <CopyIcon />
                    Бүгдийг хуулах
                  </button>
                  <button
                    className="delete-contact-button"
                    type="button"
                    onClick={() => void removeContact(person)}
                    disabled={deletingId === person.id}
                  >
                    {deletingId === person.id ? "Устгаж байна..." : "Устгах"}
                  </button>
                </div>
                {person.createdAt ? <time>{person.createdAt}</time> : null}
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
