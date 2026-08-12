import "server-only";
import { google, type sheets_v4 } from "googleapis";
import { parseCsv } from "@/lib/csv";
import type { Registration, RegistrationInput } from "@/lib/types";

const DEFAULT_SHEET_ID = "14h3HO7EsdrF-zYfiV2kxPEaHEMshRwnI7IgirIV3RZA";
const HEADERS = [
  "Овог",
  "Нэр",
  "Gmail",
  "Утасны дугаар",
  "Хаяг",
  "Эрх",
  "Зураг",
  "Бүртгүүлсэн огноо",
  "ID",
] as const;

function sheetId() {
  return process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
}

function credentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as {
        client_email: string;
        private_key: string;
      };
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON буруу форматтай байна.");
    }
  }

  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const private_key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!client_email || !private_key) return null;
  return { client_email, private_key };
}

async function sheetsClient(): Promise<sheets_v4.Sheets | null> {
  const serviceAccount = credentials();
  if (!serviceAccount) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("mn-MN");
}

function indexOfHeader(headers: string[], names: string[], fallback: number) {
  const normalizedNames = names.map(normalize);
  const found = headers.findIndex((header) => normalizedNames.includes(normalize(header)));
  return found === -1 ? fallback : found;
}

function rowsToRegistrations(rows: string[][]): Registration[] {
  if (rows.length < 2) return [];
  const headers = rows[0];
  const indexes = {
    lastName: indexOfHeader(headers, ["Овог"], 0),
    firstName: indexOfHeader(headers, ["Нэр"], 1),
    email: indexOfHeader(headers, ["Gmail", "Имэйл", "Email"], 2),
    phone: indexOfHeader(headers, ["Утасны дугаар", "Утас"], 3),
    address: indexOfHeader(headers, ["Хаяг"], 4),
    role: indexOfHeader(headers, ["Эрх", "Албан тушаал"], 5),
    photo: indexOfHeader(headers, ["Зураг", "Photo"], 6),
    createdAt: indexOfHeader(headers, ["Бүртгүүлсэн огноо", "Огноо"], 7),
    id: indexOfHeader(headers, ["ID"], 8),
  };

  return rows
    .slice(1)
    .map((row, index) => ({
      id: row[indexes.id]?.trim() || `sheet-row-${index + 2}`,
      lastName: row[indexes.lastName]?.trim() || "",
      firstName: row[indexes.firstName]?.trim() || "",
      email: row[indexes.email]?.trim() || "",
      phone: row[indexes.phone]?.trim() || "",
      address: row[indexes.address]?.trim() || "",
      role: row[indexes.role]?.trim() || "Ажилтан",
      photo: row[indexes.photo]?.trim() || "",
      createdAt: row[indexes.createdAt]?.trim() || "",
    }))
    .filter((item) => item.lastName || item.firstName || item.email || item.phone || item.photo)
    .reverse();
}

async function getRows(): Promise<string[][]> {
  const client = await sheetsClient();
  if (client) {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId(),
      range: "A:I",
    });
    return (response.data.values as string[][] | undefined) || [];
  }

  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId()}/export?format=csv`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("Google Sheet-ээс мэдээлэл уншиж чадсангүй.");
  return parseCsv(await response.text());
}

export async function getRegistrations() {
  return rowsToRegistrations(await getRows());
}

async function ensureHeaders(client: sheets_v4.Sheets) {
  const response = await client.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: "A1:I1",
  });
  const current = (response.data.values?.[0] as string[] | undefined) || [];
  const complete = HEADERS.map((header, index) => current[index]?.trim() || header);
  const changed = HEADERS.some((header, index) => normalize(complete[index]) !== normalize(header));

  if (changed || current.length < HEADERS.length) {
    await client.spreadsheets.values.update({
      spreadsheetId: sheetId(),
      range: "A1:I1",
      valueInputOption: "RAW",
      requestBody: { values: [[...HEADERS]] },
    });
  }
}

export async function addRegistration(input: RegistrationInput): Promise<Registration> {
  const client = await sheetsClient();
  if (!client) {
    throw new Error(
      "Google Sheet бичих эрх тохируулаагүй байна. Service account-ийн тохиргоог шалгана уу.",
    );
  }

  await ensureHeaders(client);
  const registration: Registration = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Ulaanbaatar",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date()),
  };

  const existingResponse = await client.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: "A:I",
  });
  const existingRows = (existingResponse.data.values as string[][] | undefined) || [];
  const emptyRowIndex = existingRows.slice(1).findIndex((row) =>
    [0, 1, 2, 3, 4, 6, 7, 8].every((column) => !row[column]?.trim()),
  );
  const targetRow = emptyRowIndex === -1 ? Math.max(existingRows.length + 1, 2) : emptyRowIndex + 2;

  await client.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `A${targetRow}:I${targetRow}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        registration.lastName,
        registration.firstName,
        registration.email,
        registration.phone,
        registration.address,
        registration.role,
        registration.photo,
        registration.createdAt,
        registration.id,
      ]],
    },
  });

  return registration;
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const client = await sheetsClient();
  if (!client) {
    throw new Error(
      "Google Sheet бичих эрх тохируулаагүй байна. Service account-ийн тохиргоог шалгана уу.",
    );
  }

  const response = await client.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: "A:I",
  });
  const rows = (response.data.values as string[][] | undefined) || [];
  let rowIndex = rows.findIndex((row, index) => index > 0 && row[8]?.trim() === id);

  if (rowIndex === -1) {
    const legacyMatch = /^sheet-row-(\d+)$/.exec(id);
    const legacyRow = legacyMatch ? Number(legacyMatch[1]) : 0;
    if (legacyRow >= 2 && legacyRow <= rows.length && !rows[legacyRow - 1]?.[8]?.trim()) {
      rowIndex = legacyRow - 1;
    }
  }

  if (rowIndex < 1) return false;
  await client.spreadsheets.values.clear({
    spreadsheetId: sheetId(),
    range: `A${rowIndex + 1}:I${rowIndex + 1}`,
  });
  return true;
}
