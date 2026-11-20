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

// The contact form. Submissions are delivered by email to `to` (and copied to
// every address in `cc`) through
// FormSubmit (formsubmit.co) — no backend of our own. FormSubmit asks the
// inbox owner to confirm once, via an activation email sent on the first
// submission; until then nothing is delivered.
export function ContactForm({ to, cc = [] }: { to: string; cc?: string[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const sourceLabelId = `src-${useId().replace(/:/g, "")}`;
  const inquiryLabelId = `inq-${useId().replace(/:/g, "")}`;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const get = (k: string) => String(f.get(k) ?? "").trim();

    // Bots fill the hidden field; people never see it.
    if (get("_honey")) return;

    setStatus("sending");
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${to}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Name: get("name"),
          Email: get("email"),
          "Inquiry type": get("inquiry") || "-",
          "Heard about us": get("source") || "-",
          Message: get("message"),
          _subject: `New enquiry from ${get("name")}${get("inquiry") ? ` (${get("inquiry")})` : ""}`,
          _replyto: get("email"),
          ...(cc.length ? { _cc: cc.join(",") } : {}),
          _template: "table",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: string | boolean };
      if (!res.ok || String(data.success) !== "true") throw new Error("send failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
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
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "error" && (
          <p className="cform-note cform-note--error" role="alert">
            Something went wrong sending your message. Please try again, or write to us at{" "}
            <a href={`mailto:${to}`}>{to}</a>.
          </p>
        )}
      </div>
    </form>
  );
}
