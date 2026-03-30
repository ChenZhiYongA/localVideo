import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MediaCard } from "../media/MediaCard";

export function MediaRow({ title, items, moreLink, onPlay }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth * 0.75;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
        {moreLink && (
          <Link to={moreLink} className="text-sm text-yt-text-2 transition-colors hover:text-yt-red">
            查看全部 →
          </Link>
        )}
      </div>
      <div className="relative -mx-1">
        {canLeft && (
          <button
            type="button"
            className="absolute -left-1 top-0 z-10 flex h-full w-10 items-center justify-center bg-gradient-to-r from-yt-bg to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
            onClick={() => scroll(-1)}
          >
            <span className="material-icons-round rounded-full bg-yt-surface/90 p-1 text-xl text-yt-text shadow">
              chevron_left
            </span>
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2 hide-scrollbar sm:gap-4"
          onScroll={checkScroll}
        >
          {items.map((m) => (
            <div key={m.id} className="w-[44vw] max-w-[220px] shrink-0 sm:w-52">
              <MediaCard media={m} onClick={() => onPlay(m)} />
            </div>
          ))}
        </div>
        {canRight && (
          <button
            type="button"
            className="absolute -right-1 top-0 z-10 flex h-full w-10 items-center justify-center bg-gradient-to-l from-yt-bg to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
            onClick={() => scroll(1)}
          >
            <span className="material-icons-round rounded-full bg-yt-surface/90 p-1 text-xl text-yt-text shadow">
              chevron_right
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
