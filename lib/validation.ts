import type { RegistrationInput } from "@/lib/types";

const DATA_IMAGE = /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateRegistration(value: unknown):
  | { ok: true; data: RegistrationInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Мэдээллийн формат буруу байна." };
  }

  const body = value as Record<string, unknown>;
  const photo = typeof body.photo === "string" ? body.photo.trim() : "";
  const data: RegistrationInput = {
    lastName: text(body.lastName, 80),
    firstName: text(body.firstName, 80),
    email: text(body.email, 120).toLowerCase(),
    phone: text(body.phone, 24),
    address: text(body.address, 240),
    role: "Ажилтан",
    photo,
  };

  if (data.lastName.length < 2 || data.firstName.length < 2) {
    return { ok: false, error: "Овог, нэрээ бүтнээр оруулна уу." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { ok: false, error: "Зөв имэйл хаяг оруулна уу." };
  }
  if (!/^[+\d][\d\s()-]{5,22}$/.test(data.phone)) {
    return { ok: false, error: "Зөв утасны дугаар оруулна уу." };
  }
  if (data.address.length < 3) {
    return { ok: false, error: "Хаягаа оруулна уу." };
  }
  if (!DATA_IMAGE.test(data.photo) || data.photo.length > 48_000) {
    return { ok: false, error: "Зургаа дахин сонгоно уу. Зураг хэт том байж болохгүй." };
  }

  return { ok: true, data };
}
