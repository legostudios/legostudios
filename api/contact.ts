// Contact form → email, as a Vercel function (Web Request/Response API).
// The site posts the form here; this sends it through Resend
// (https://resend.com) to hello@legostudios.co with a copy to
// jashwanth@legostudios.co, with Reply-To set to the visitor so a reply goes
// straight back to them.
//
// Needs, in Vercel → Project → Settings → Environment Variables:
//   RESEND_API_KEY   the Resend API key
//   CONTACT_FROM     optional sender, e.g. "Lego Studios <website@legostudios.co>"
//                    (the domain must be verified in Resend)
// Without the key it answers 503, and the form offers a direct email instead
// of pretending the message was sent.

const TO = "hello@legostudios.co";
const CC = ["jashwanth@legostudios.co"];
const DEFAULT_FROM = "Lego Studios website <website@legostudios.co>";

const LIMITS = { name: 200, email: 320, inquiry: 100, source: 100, message: 5000 };

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function POST(request: Request): Promise<Response> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return json(503, { ok: false, error: "not_configured" });

  let data: Record<string, unknown>;
  try {
    data = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, error: "bad_request" });
  }
  const field = (k: keyof typeof LIMITS) => String(data[k] ?? "").trim().slice(0, LIMITS[k]);

  // Bots fill the hidden field; pretend success so they move on.
  if (String(data.honey ?? "").trim()) return json(200, { ok: true });

  const name = field("name");
  const email = field("email");
  const message = field("message");
  const inquiry = field("inquiry") || "-";
  const source = field("source") || "-";
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(422, { ok: false, error: "invalid" });
  }

  const subject = `New enquiry from ${name}${inquiry !== "-" ? ` (${inquiry})` : ""}`;
  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Inquiry type", inquiry],
    ["Heard about us", source],
  ];
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${message}`;
  const html = `<table cellpadding="6" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#666">${k}</td><td>${escape(v)}</td></tr>`)
    .join("")}</table><p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;white-space:pre-wrap">${escape(message)}</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || DEFAULT_FROM,
      to: [TO],
      cc: CC,
      reply_to: email,
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""));
    return json(502, { ok: false, error: "send_failed" });
  }
  return json(200, { ok: true });
}
