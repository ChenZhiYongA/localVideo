import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLibrary } from "../api/library";
import { MediaGrid } from "../components/media/MediaGrid";
import { useUiStore } from "../store/uiStore";

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
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");

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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-yt-border p-0.5">
          {["all", "video", "image", "audio"].map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${
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
              className={`rounded-md px-2.5 py-1.5 text-sm ${
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
        <div className="ml-auto flex items-center gap-2">
          <select
            className="rounded-md border border-yt-border bg-yt-bg px-2 py-1.5 text-sm text-yt-text"
            value={`${sort}-${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-");
              setSort(s);
              setOrder(o);
            }}
          >
            <option value="date-desc">日期 ↓</option>
            <option value="date-asc">日期 ↑</option>
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

      {query.isLoading && <p className="text-yt-text-2">加载中…</p>}
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
