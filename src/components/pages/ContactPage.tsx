import { PageShell } from "./PageShell";
import { ContactForm } from "../ContactForm";
import { PixelIcon } from "../PixelIcon";
import { toRects } from "../../lib/pixels";

const EMAIL = "hello@legostudios.co";
// Form submissions go to EMAIL and are copied to these addresses.
const FORM_CC = ["jashwanth@legostudios.co"];
const LINKEDIN = "https://www.linkedin.com/company/lego-studios/";
const INSTAGRAM = "https://www.instagram.com/legostudios.in";

interface Props {
  open: boolean;
  onBack: () => void;
}

// Pixel-art icons on a 13×13 grid, shown at 2× (26px) like the menu square
// and contact icon. All three share one shape — a filled rounded square with
// the symbol cut out — so they read as a set. "f" = filled (current colour),
// "." = cut out.
const MAIL = [
  "..fffffffff..",
  ".fffffffffff.",
  "fffffffffffff",
  "ff.........ff",
  "ff..fffff..ff",
  "ff.f.fff.f.ff",
  "ff.ff.f.ff.ff",
  "ff.fff.fff.ff",
  "ff.fffffff.ff",
  "ff.........ff",
  "fffffffffffff",
  ".fffffffffff.",
  "..fffffffff..",
];
const INSTA = [
  "..fffffffff..",
  ".fffffffffff.",
  "fff.......fff",
  "ff.fffff.f.ff",
  "ff.ff...ff.ff",
  "ff.f.fff.f.ff",
  "ff.f.fff.f.ff",
  "ff.f.fff.f.ff",
  "ff.ff...ff.ff",
  "ff.fffffff.ff",
  "fff.......fff",
  ".fffffffffff.",
  "..fffffffff..",
];
const LINKED = [
  "..fffffffff..",
  ".fffffffffff.",
  "ff..fffffffff",
  "ff..fffffffff",
  "fffffffffffff",
  "ff..f......ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  ".fffffffffff.",
  "..fffffffff..",
];

// Give an icon a black pixel outline: filled pixels that touch the outside
// (not the cut-out symbol) become "#". Keeps the yellow and sky icons crisp
// on the white page.
function outlined(grid: string[]): string[] {
  const h = grid.length;
  const w = grid[0].length;
  const outside = grid.map((r) => [...r].map(() => false));
  const stack: [number, number][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && grid[y][x] === ".") stack.push([x, y]);
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h || outside[y][x] || grid[y][x] !== ".") continue;
    outside[y][x] = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const isOut = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || outside[y][x];
  return grid.map((row, y) =>
    [...row]
      .map((c, x) => (c === "f" && (isOut(x + 1, y) || isOut(x - 1, y) || isOut(x, y + 1) || isOut(x, y - 1)) ? "#" : c))
      .join(""),
  );
}

const LINKS = [
  { label: `Email ${EMAIL}`, href: `mailto:${EMAIL}`, grid: MAIL, tone: "yellow", external: false },
  { label: "Instagram", href: INSTAGRAM, grid: INSTA, tone: "sky", external: true },
  { label: "LinkedIn", href: LINKEDIN, grid: LINKED, tone: "pink", external: true },
];

// The word "contact" in square pixels, after the design reference: each
// letter on a 5×6 grid, one empty column between letters.
const GLYPHS: Record<string, string[]> = {
  c: [".###.", "#...#", "#....", "#....", "#...#", ".###."],
  o: [".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  n: [".....", "#.##.", "##..#", "#...#", "#...#", "#...#"],
  t: [".#...", "#####", ".#...", ".#...", ".#...", "..###"],
  a: [".....", ".###.", "....#", ".####", "#...#", ".##.#"],
  c2: [".....", ".####", "#....", "#....", "#...#", ".###."],
};
const WORD = ["c", "o", "n", "t", "a", "c2", "t"];
const COLS = WORD.length * 6 - 1;
const CELLS: [number, number][] = WORD.flatMap((g, li) =>
  GLYPHS[g].flatMap((row, y) => [...row].flatMap((ch, x) => (ch === "#" ? [[li * 6 + x, y] as [number, number]] : []))),
);

function PixelWord() {
  return (
    <svg className="contact-word" viewBox={`0 0 ${COLS} 6`} aria-hidden="true" focusable="false">
      {CELLS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.13} y={y + 0.13} width={0.74} height={0.74} />
      ))}
    </svg>
  );
}

// Contact — white. The word "contact" in big square pixels across the top;
// bottom-left the enquiry form in small type; bottom-right the email /
// Instagram / LinkedIn pixel icons stacked.
export function ContactPage({ open, onBack }: Props) {
  return (
    <PageShell open={open} theme="white" label="Contact" onBack={onBack}>
      <div className="contact2">
        <h1 className="sr-only">Contact</h1>
        <PixelWord />
        <div className="contact2-bottom">
          <section className="contact2-form" aria-label="Send a message">
            <h2 className="contact2-form-heading">Send a message</h2>
            <ContactForm to={EMAIL} cc={FORM_CC} />
          </section>
          <ul className="contact2-socials">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-label={l.label}
                  title={l.label}
                  className={`contact-icon contact-icon--${l.tone}`}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <PixelIcon rects={toRects(outlined(l.grid))} grid={13} size={39} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
