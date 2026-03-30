import { useEffect, useRef, useState } from "react";

export function QualityMenu({ qualities, currentIndex, onQuality }) {
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

  if (!qualities?.length) return null;

  const label = currentIndex === -1 ? "自动" : `${qualities[currentIndex]?.height}p`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex h-9 items-center gap-1 rounded-full px-2 text-xs font-medium text-white hover:bg-white/10"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="material-icons-round text-base">settings</span>
        {label}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 overflow-hidden rounded-lg bg-[#1a1a1a]/95 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-xs transition-colors hover:bg-white/10 ${
              currentIndex === -1 ? "text-yt-red" : "text-white"
            }`}
            onClick={() => { onQuality(-1); setOpen(false); }}
          >
            {currentIndex === -1 && <span className="material-icons-round text-sm">check</span>}
            <span className={currentIndex !== -1 ? "ml-6" : ""}>自动</span>
          </button>
          {qualities.map((q, i) => (
            <button
              key={i}
              type="button"
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-xs transition-colors hover:bg-white/10 ${
                currentIndex === i ? "text-yt-red" : "text-white"
              }`}
              onClick={() => { onQuality(i); setOpen(false); }}
            >
              {currentIndex === i && <span className="material-icons-round text-sm">check</span>}
              <span className={currentIndex !== i ? "ml-6" : ""}>{q.height}p</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
