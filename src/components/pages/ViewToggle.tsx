export type PageView = "overview" | "index";

// Bottom-right switch between the 3D overview and the plain index list.
export function ViewToggle({ view, onChange }: { view: PageView; onChange: (v: PageView) => void }) {
  return (
    <div className="view-toggle" role="group" aria-label="View">
      {(["overview", "index"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          className={view === v ? "is-active" : ""}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
