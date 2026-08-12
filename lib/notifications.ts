import "server-only";
import type { Registration } from "@/lib/types";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

async function sendTelegram(registration: Registration) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const message = [
    "🟢 Шинэ хүн бүртгүүллээ",
    `Нэр: ${registration.lastName} ${registration.firstName}`,
    `Эрх: ${registration.role}`,
    `Утас: ${registration.phone}`,
    `Имэйл: ${registration.email}`,
    `Хаяг: ${registration.address}`,
    `Огноо: ${registration.createdAt}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  if (!response.ok) throw new Error(`Telegram мэдэгдэл амжилтгүй: ${response.status}`);
}

async function sendEmail(registration: Registration) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !to) return;

  const fullName = escapeHtml(`${registration.lastName} ${registration.firstName}`);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Burtgel <onboarding@resend.dev>",
      to: [to],
      subject: `Шинэ бүртгэл: ${registration.lastName} ${registration.firstName}`,
      html: `<h2>Шинэ хүн бүртгүүллээ</h2><p><b>Нэр:</b> ${fullName}</p><p><b>Эрх:</b> ${escapeHtml(registration.role)}</p><p><b>Утас:</b> ${escapeHtml(registration.phone)}</p><p><b>Имэйл:</b> ${escapeHtml(registration.email)}</p><p><b>Хаяг:</b> ${escapeHtml(registration.address)}</p><p><b>Огноо:</b> ${escapeHtml(registration.createdAt)}</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Имэйл мэдэгдэл амжилтгүй: ${response.status}`);
}

export async function notifyNewRegistration(registration: Registration) {
  const results = await Promise.allSettled([
    sendTelegram(registration),
    sendEmail(registration),
  ]);
  results.forEach((result) => {
    if (result.status === "rejected") console.error(result.reason);
  });
}
