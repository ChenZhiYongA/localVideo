import { useEffect, useRef, useState } from "react";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function SpeedMenu({ speed, onSpeed }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex h-9 items-center justify-center rounded-full px-2 text-xs font-medium text-white hover:bg-white/10"
        onClick={() => setOpen((o) => !o)}
      >
        {speed === 1 ? "1x" : `${speed}x`}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 overflow-hidden rounded-lg bg-[#1a1a1a]/95 shadow-lg backdrop-blur-sm">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-xs transition-colors hover:bg-white/10 ${
                speed === s ? "text-yt-red" : "text-white"
              }`}
              onClick={() => { onSpeed(s); setOpen(false); }}
            >
              {speed === s && <span className="material-icons-round text-sm">check</span>}
              <span className={speed !== s ? "ml-6" : ""}>{s === 1 ? "正常" : `${s}x`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
