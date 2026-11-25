import { useId, useState, type FormEvent } from "react";
import { SourceSelect } from "./SourceSelect";

const SOURCES = [
  "Google / Search engine",
  "LinkedIn",
  "Instagram",
  "X (Twitter)",
  "YouTube",
  "Referral / Word of mouth",
  "Event / Podcast",
  "Other",
];

const INQUIRY_TYPES = ["Service enquiry", "Careers", "Others"];

type Status = "idle" | "sending" | "sent" | "error";

// After this long the button says "Still sending…"; after the limit we stop
// waiting and offer a direct email instead.
const SLOW_MS = 5000;
const LIMIT_MS = 30000;

// The contact form. Submissions go to our Vercel function (api/contact.ts),
// which emails them through Resend to hello@ with a copy to jashwanth@.
// `to` / `cc` are only used for the direct-email fallback if sending fails.
export function ContactForm({ to, cc = [] }: { to: string; cc?: string[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [slow, setSlow] = useState(false);
  // A ready-made email with the visitor's message, for when sending fails.
  const [fallback, setFallback] = useState(`mailto:${to}`);
  const sourceLabelId = `src-${useId().replace(/:/g, "")}`;
  const inquiryLabelId = `inq-${useId().replace(/:/g, "")}`;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const get = (k: string) => String(f.get(k) ?? "").trim();

    // Bots fill the hidden field; people never see it.
    if (get("_honey")) return;

    const subject = `New enquiry from ${get("name")}${get("inquiry") ? ` (${get("inquiry")})` : ""}`;
    const body = [
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `Inquiry type: ${get("inquiry") || "-"}`,
      `Heard about us: ${get("source") || "-"}`,
      "",
      get("message"),
    ].join("\n");
    setFallback(
      `mailto:${to}?${cc.length ? `cc=${encodeURIComponent(cc.join(","))}&` : ""}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );

    setStatus("sending");
    setSlow(false);
    const ctrl = new AbortController();
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_MS);
    const limitTimer = window.setTimeout(() => ctrl.abort(), LIMIT_MS);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          inquiry: get("inquiry"),
          source: get("source"),
          message: get("message"),
          honey: get("_honey"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || data.ok !== true) throw new Error("send failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      window.clearTimeout(slowTimer);
      window.clearTimeout(limitTimer);
      setSlow(false);
    }
  };

  if (status === "sent") {
    return (
      <div className="cform-done" role="status">
        <p className="cform-done-title">Thanks — message sent.</p>
        <p className="cform-note">We'll get back to you soon.</p>
        <button type="button" className="cform-again" onClick={() => setStatus("idle")}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={onSubmit}>
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="cform-honey" aria-hidden="true" />
      <div className="cform-grid">
        <label className="cform-field">
          <span className="cform-label">Name</span>
          <input name="name" type="text" required autoComplete="name" placeholder="Your name" />
        </label>
        <label className="cform-field">
          <span className="cform-label">Email</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </label>
        <div className="cform-field">
          <span className="cform-label" id={inquiryLabelId}>
            Inquiry type
          </span>
          <SourceSelect name="inquiry" labelId={inquiryLabelId} options={INQUIRY_TYPES} placeholder="Select an option" />
        </div>
        <div className="cform-field">
          <span className="cform-label" id={sourceLabelId}>
            Where did you hear about us?
          </span>
          <SourceSelect name="source" labelId={sourceLabelId} options={SOURCES} placeholder="Select an option" />
        </div>
        <label className="cform-field cform-field--wide">
          <span className="cform-label">Message</span>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="How can we help you?"
          />
        </label>
      </div>
      <div className="cform-actions">
        <button type="submit" className="cform-submit" disabled={status === "sending"}>
          {status === "sending" ? (slow ? "Still sending…" : "Sending…") : "Send message"}
        </button>
        {status === "error" && (
          <p className="cform-note cform-note--error" role="alert">
            We couldn't send that just now. Please try again, or{" "}
            <a href={fallback}>email it to us directly</a> (your message is already filled in).
          </p>
        )}
      </div>
    </form>
  );
}
