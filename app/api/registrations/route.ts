import { after } from "next/server";
import { addRegistration, getRegistrations } from "@/lib/sheets";
import { notifyNewRegistration } from "@/lib/notifications";
import { validateRegistration } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const registrations = await getRegistrations();
    return Response.json({ registrations }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Бүртгэлийн мэдээллийг авч чадсангүй." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.website === "string" && body.website) {
      return Response.json({ ok: true }, { status: 201 });
    }

    const result = validateRegistration(body);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

    const registration = await addRegistration(result.data);
    after(() => notifyNewRegistration(registration));
    return Response.json({ registration }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Бүртгэл хадгалж чадсангүй.";
    return Response.json({ error: message }, { status: 500 });
  }
}
