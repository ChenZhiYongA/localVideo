import { useEffect, useRef } from "react";
import { MediaCard } from "./MediaCard";

export function MediaGrid({ items, onSelect, search, viewMode, fetchNextPage, hasNextPage, isFetchingNextPage }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((m) => (
          <MediaCard key={m.id} media={m} onClick={() => onSelect(m)} viewMode="list" search={search} />
        ))}
        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && <p className="py-4 text-center text-sm text-yt-text-2">加载中…</p>}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((m) => (
          <MediaCard key={m.id} media={m} onClick={() => onSelect(m)} viewMode="grid" search={search} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <p className="py-4 text-center text-sm text-yt-text-2">加载中…</p>}
    </>
  );
}
