const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const ROWS = 14;
const MIN_W = 54; // % width of the top folder
const MAX_W = 90; // % width of the bottom folder

// Black section-divider tabs, keyed by row index: [letter, count].
const DIVIDERS: Record<number, [string, string]> = {
  1: ["O", "010"],
  4: ["P", "012"],
  7: ["Q", "005"],
  10: ["R", "002"],
  13: ["S", "002"],
};

// A filing-drawer of overlapping folder tabs, every label reading "sample".
export function FilingDrawer() {
  const rows = Array.from({ length: ROWS });
  return (
    <div
      className="mx-auto w-[min(94vw,660px)] select-none"
      style={{ fontFamily: HELV }}
    >
      <div className="flex flex-col items-center">
        {rows.map((_, i) => {
          const w = MIN_W + ((MAX_W - MIN_W) * i) / (ROWS - 1);
          const n1 = 94 + i * 2;
          const n2 = 95 + i * 2;
          const div = DIVIDERS[i];
          return (
            <div
              key={i}
              className="group relative rounded-t-[30px] border border-black bg-[#eceae5] transition-colors duration-200 hover:bg-white"
              style={{
                width: `${w}%`,
                height: 46,
                marginTop: i === 0 ? 0 : -18,
                zIndex: i + 1,
              }}
            >
              <div className="absolute left-[calc(50%+30px)] top-[7px] grid w-[min(52vw,300px)] -translate-x-1/2 grid-cols-[1.7rem_1fr_1.7rem_1fr] items-center gap-x-3 text-[12.5px] leading-none text-black">
                <span className="text-right tabular-nums">{n1}</span>
                <span>sample</span>
                <span className="text-right tabular-nums">{n2}</span>
                <span>sample</span>
              </div>

              {div && (
                <div className="absolute left-[7%] top-[-2px] z-10 flex items-center gap-6 rounded-t-[14px] border border-black bg-black px-4 py-[4px] text-[11px] leading-none text-white">
                  <span>{div[0]}</span>
                  <span className="tabular-nums">{div[1]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer front lip — a trapezoid flaring out for a 3D drawer edge. */}
      <svg
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className="mx-auto block h-10 w-full"
        aria-hidden="true"
      >
        <polygon
          points="5,0 95,0 100,10 0,10"
          fill="#e2e0da"
          stroke="black"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Yellow title tab. */}
      <div
        className="mx-auto mt-5 w-fit rounded-[8px] border border-black bg-[#efe94b] px-7 py-2 text-[13px] leading-none text-black"
      >
        our services
      </div>
    </div>
  );
}
