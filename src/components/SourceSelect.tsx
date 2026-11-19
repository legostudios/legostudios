import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

interface Props {
  name: string;
  labelId: string;
  options: string[];
  placeholder: string;
}

// A dropdown drawn in the site's own style (the browser's native <select>
// list can't be styled). Keyboard: Enter / Space / arrows open it; arrows,
// Home / End move; Enter / Space choose; Escape or Tab closes. The value is
// submitted through a hidden input, like a normal form field.
export function SourceSelect({ name, labelId, options, placeholder }: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId().replace(/:/g, "");
  const optId = (i: number) => `${id}-opt-${i}`;

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) list.current?.querySelector(`#${optId(active)}`)?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const openList = () => {
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const choose = (i: number) => {
    setValue(options[i]);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(options.length - 1, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={root} className={`cselect ${open ? "is-open" : ""}`}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={`${id}-btn`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${labelId} ${id}-btn`}
        aria-activedescendant={open ? optId(active) : undefined}
        className={`cselect-trigger ${value ? "" : "is-placeholder"}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {value || placeholder}
      </button>
      {open && (
        <ul ref={list} id={`${id}-list`} role="listbox" aria-labelledby={labelId} className="cselect-list">
          {options.map((o, i) => (
            <li
              key={o}
              id={optId(i)}
              role="option"
              aria-selected={o === value}
              className={`cselect-option ${i === active ? "is-active" : ""} ${o === value ? "is-selected" : ""}`}
              onPointerEnter={() => setActive(i)}
              // Keep focus on the button while clicking an option.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
