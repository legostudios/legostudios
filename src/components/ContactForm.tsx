import { useState, type FormEvent } from "react";

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

// The contact form. There's no server behind the site, so sending opens the
// visitor's email app with a message to `to`, pre-filled with every answer.
export function ContactForm({ to }: { to: string }) {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const name = get("name");
    const subject = `New enquiry from ${name}${get("company") ? ` (${get("company")})` : ""}`;
    const body = [
      `Name: ${name}`,
      `Email: ${get("email")}`,
      `Company: ${get("company") || "-"}`,
      `Heard about us: ${get("source") || "-"}`,
      "",
      get("message"),
    ].join("\n");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form className="cform" onSubmit={onSubmit}>
      <div className="cform-grid">
        <label className="cform-field">
          <span className="cform-label">Name</span>
          <input name="name" type="text" required autoComplete="name" placeholder="Your name" />
        </label>
        <label className="cform-field">
          <span className="cform-label">Email</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </label>
        <label className="cform-field">
          <span className="cform-label">Company</span>
          <input name="company" type="text" autoComplete="organization" placeholder="Company name" />
        </label>
        <label className="cform-field">
          <span className="cform-label">Where did you hear about us?</span>
          <span className="cform-select">
            <select name="source" defaultValue="">
              <option value="" disabled>
                Select an option
              </option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="cform-field cform-field--wide">
          <span className="cform-label">Message</span>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="What are you launching, and who does it need to reach?"
          />
        </label>
      </div>
      <div className="cform-actions">
        <button type="submit" className="cform-submit">
          Send message
        </button>
        {sent && (
          <p className="cform-note" role="status">
            Your email app should open with the message ready to send. If it doesn't, write to us at{" "}
            <a href={`mailto:${to}`}>{to}</a>.
          </p>
        )}
      </div>
    </form>
  );
}
