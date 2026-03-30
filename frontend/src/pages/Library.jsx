import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLibrary } from "../api/library";
import { MediaGrid } from "../components/media/MediaGrid";
import { MediaGridSkeleton } from "../components/ui/Skeleton";
import { useUiStore } from "../store/uiStore";

const SORT_ORDER_KEYS = new Set([
  "date",
  "name",
  "size",
  "duration",
  "play_count",
  "indexed",
  "recommend",
]);

export function Library() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const folder = params.get("folder");
  const typeParam = params.get("type") || "all";
  const type =
    typeParam === "video" || typeParam === "image" || typeParam === "audio" ? typeParam : "all";
  const sourceParam = params.get("source");
  const source =
    sourceParam === "telegram" || sourceParam === "local" ? sourceParam : "all";
  const folderId = folder ? Number(folder) : undefined;
  const navigate = useNavigate();
  const libraryView = useUiStore((s) => s.libraryView);
  const setLibraryView = useUiStore((s) => s.setLibraryView);

  const sortRaw = params.get("sort");
  const sort = SORT_ORDER_KEYS.has(sortRaw) ? sortRaw : "date";
  const order = params.get("order") === "asc" ? "asc" : "desc";

  const query = useLibrary({
    type,
    folder_id: Number.isFinite(folderId) ? folderId : undefined,
    search: q || undefined,
    sort,
    order,
    per_page: 40,
    source,
  });

  const items = useMemo(() => query.data?.pages?.flatMap((p) => p.items) ?? [], [query.data]);

  const onSelect = (m) => {
    navigate(`/player/${m.id}`);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex rounded-lg border border-yt-border p-0.5">
          {["all", "video", "image", "audio"].map((t) => (
            <button
              key={t}
              type="button"
              className={`min-h-[40px] rounded-md px-2.5 py-1.5 text-sm sm:px-3 ${
                type === t ? "bg-yt-surface-2 text-yt-text" : "text-yt-text-2"
              }`}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (t === "all") next.delete("type");
                else next.set("type", t);
                navigate(`/library?${next.toString()}`);
              }}
            >
              {t === "all" ? "全部" : t === "video" ? "视频" : t === "image" ? "图片" : "音频"}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-yt-border p-0.5">
          {[
            { value: "all", label: "混合" },
            { value: "local", label: "本地" },
            { value: "telegram", label: "Telegram" },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              className={`min-h-[40px] rounded-md px-2 py-1.5 text-sm sm:px-2.5 ${
                source === o.value ? "bg-yt-surface-2 text-yt-text" : "text-yt-text-2"
              }`}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (o.value === "all") next.delete("source");
                else next.set("source", o.value);
                navigate(`/library?${next.toString()}`);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:ml-auto lg:w-auto">
          <select
            className="min-h-[40px] min-w-0 flex-1 rounded-md border border-yt-border bg-yt-bg px-2 py-1.5 text-sm text-yt-text sm:flex-none"
            value={`${sort}-${sort === "recommend" ? "desc" : order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-");
              const next = new URLSearchParams(params);
              next.set("sort", s);
              if (s === "recommend") {
                next.delete("order");
              } else {
                next.set("order", o);
              }
              navigate(`/library?${next.toString()}`);
            }}
          >
            <option value="recommend-desc">为你推荐</option>
            <option value="date-desc">日期 ↓</option>
            <option value="date-asc">日期 ↑</option>
            <option value="indexed-desc">入库时间 ↓</option>
            <option value="indexed-asc">入库时间 ↑</option>
            <option value="name-asc">名称 A-Z</option>
            <option value="name-desc">名称 Z-A</option>
            <option value="size-desc">大小 ↓</option>
            <option value="duration-desc">时长 ↓</option>
            <option value="play_count-desc">播放次数 ↓</option>
          </select>
          <div className="flex rounded-lg border border-yt-border p-0.5">
            <button
              type="button"
              className={`rounded px-2 py-1 ${libraryView === "grid" ? "bg-yt-surface-2" : ""}`}
              onClick={() => setLibraryView("grid")}
            >
              <span className="material-icons-round text-lg">grid_view</span>
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${libraryView === "list" ? "bg-yt-surface-2" : ""}`}
              onClick={() => setLibraryView("list")}
            >
              <span className="material-icons-round text-lg">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {query.isLoading && <MediaGridSkeleton count={20} />}
      {query.isError && <p className="text-red-400">加载失败</p>}
      {!query.isLoading && !items.length && <p className="text-yt-text-2">暂无内容，试试扫描或更换筛选。</p>}

      {items.length > 0 && (
        <MediaGrid
          items={items}
          onSelect={onSelect}
          search={q}
          viewMode={libraryView}
          fetchNextPage={query.fetchNextPage}
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
        />
      )}
    </div>
  );
}
