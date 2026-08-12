"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

type Status = { kind: "idle" | "loading" | "success" | "error"; message?: string };

async function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Зургийг боловсруулах боломжгүй байна.");
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Зургийг уншиж чадсангүй."));
    reader.readAsDataURL(blob);
  });
}

async function compressPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Зөвхөн зураг сонгоно уу.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Зураг 10MB-аас бага байх ёстой.");

  const bitmap = await createImageBitmap(file);
  let size = 320;
  let quality = 0.82;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Зургийг боловсруулах боломжгүй байна.");

    const sourceSize = Math.min(bitmap.width, bitmap.height);
    const sourceX = (bitmap.width - sourceSize) / 2;
    const sourceY = (bitmap.height - sourceSize) / 2;
    context.drawImage(bitmap, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
    const dataUrl = await canvasToDataUrl(canvas, quality);
    if (dataUrl.length <= 46_000) {
      bitmap.close();
      return dataUrl;
    }
    quality = Math.max(0.38, quality - 0.08);
    if (attempt > 5) size -= 32;
  }

  bitmap.close();
  throw new Error("Зургийг хангалттай хэмжээнд шахаж чадсангүй. Өөр зураг сонгоно уу.");
}

export default function RegistrationForm() {
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (status.kind === "error") setStatus({ kind: "idle" });
    setPhotoError("");
    try {
      setPhoto(await compressPhoto(file));
    } catch (error) {
      setPhoto("");
      setPhotoError(error instanceof Error ? error.message : "Зураг боловсруулж чадсангүй.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) {
      setPhotoError("Нүүр зургаа оруулна уу.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName: formData.get("lastName"),
          firstName: formData.get("firstName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          address: formData.get("address"),
          role: formData.get("role"),
          website: formData.get("website"),
          photo,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Бүртгэл хадгалж чадсангүй.");
      form.reset();
      setPhoto("");
      setStatus({ kind: "success", message: "Таны бүртгэл амжилттай хадгалагдлаа." });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Алдаа гарлаа." });
    }
  }

  function clearStaleError() {
    if (status.kind === "error") setStatus({ kind: "idle" });
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit} onChange={clearStaleError}>
      <div className="photo-row">
        <button className="photo-picker" type="button" onClick={() => fileRef.current?.click()}>
          {photo ? (
            <Image src={photo} alt="Сонгосон зураг" fill sizes="112px" unoptimized />
          ) : (
            <span className="photo-placeholder" aria-hidden="true">+</span>
          )}
        </button>
        <div>
          <strong>Нүүр зураг</strong>
          <p>Дөрвөлжин, тод зураг сонгоно уу.</p>
          <button className="text-button" type="button" onClick={() => fileRef.current?.click()}>
            {photo ? "Зураг солих" : "Зураг сонгох"}
          </button>
        </div>
        <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
      </div>
      {photoError && <p className="field-error" role="alert">{photoError}</p>}

      <div className="field-grid">
        <label><span>Овог</span><input name="lastName" autoComplete="family-name" placeholder="Бат" required /></label>
        <label><span>Нэр</span><input name="firstName" autoComplete="given-name" placeholder="Эрдэнэ" required /></label>
      </div>
      <label><span>Gmail / Имэйл</span><input name="email" type="email" autoComplete="email" placeholder="name@gmail.com" required /></label>
      <div className="field-grid">
        <label><span>Утасны дугаар</span><input name="phone" type="tel" autoComplete="tel" placeholder="9911 2233" required /></label>
        <label><span>Эрх</span><input name="role" value="Ажилтан" readOnly aria-readonly="true" /></label>
      </div>
      <label><span>Хаяг</span><textarea name="address" autoComplete="street-address" placeholder="Хот, дүүрэг, хороо..." rows={3} required /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>

      {status.kind !== "idle" && status.kind !== "loading" && (
        <div className={`form-message ${status.kind}`} role="status">{status.message}</div>
      )}
      <button className="submit-button" type="submit" disabled={status.kind === "loading"}>
        {status.kind === "loading" ? <><span className="spinner" /> Хадгалж байна...</> : <>Бүртгүүлэх <span>→</span></>}
      </button>
      <p className="privacy-note">Бүртгүүлснээр оруулсан мэдээллээ байгууллагын дотоод бүртгэлд ашиглуулахыг зөвшөөрнө.</p>
    </form>
  );
}
