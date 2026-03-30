import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useScanStatus, useTriggerScan } from "../../api/scan";
import { useUiStore } from "../../store/uiStore";
import { useScanStore } from "../../store/scanStore";
import { useDebounce } from "../../hooks/useDebounce";
import { api } from "../../api/client";

export function Topbar({ onMenu }) {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [localQ, setLocalQ] = useState(q);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const debouncedQ = useDebounce(localQ, 300);
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { data: scanStatus } = useScanStatus();
  const triggerScan = useTriggerScan();
  const tgActive = useScanStore((s) => s.tgDownloadActive);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!debouncedQ.trim()) { setResults([]); return; }
    let cancelled = false;
    api.get("/library", { params: { search: debouncedQ, per_page: 6, page: 1 } })
      .then(({ data }) => { if (!cancelled) setResults(data.items || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedQ]);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, []);

  const submitSearch = useCallback(() => {
    const s = localQ.trim();
    setShowResults(false);
    if (s) navigate(`/library?q=${encodeURIComponent(s)}`);
    else navigate("/library");
  }, [localQ, navigate]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const sidebarW = collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)";

  return (
    <header className="glass fixed left-0 right-0 top-0 z-30 border-b border-yt-border pt-[env(safe-area-inset-top,0px)]">
      <div className="flex h-[var(--topbar-h)] items-center">
        <div
          className="hidden shrink-0 items-center gap-1 px-3 md:flex"
          style={{ width: sidebarW }}
        >
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-yt-hover"
            onClick={toggleSidebar}
            aria-label="折叠侧栏"
          >
            <span className="material-icons-round text-xl">menu</span>
          </button>
          <span className="ml-1 text-base font-bold tracking-tight text-yt-red">
            Local<span className="text-yt-text">Tube</span>
          </span>
        </div>

        <button
          type="button"
          className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-yt-hover md:hidden"
          onClick={onMenu}
          aria-label="菜单"
        >
          <span className="material-icons-round">menu</span>
        </button>
        <span className="ml-2 text-base font-bold tracking-tight text-yt-red md:hidden">
          Local<span className="text-yt-text">Tube</span>
        </span>

        <div ref={searchRef} className="relative mx-auto flex min-w-0 max-w-[540px] flex-1 px-3">
          <div className="flex w-full items-center rounded-full border border-yt-border bg-yt-surface/80 px-3 py-1.5 focus-within:border-yt-accent/60 focus-within:ring-1 focus-within:ring-yt-accent/30">
            <span className="material-icons-round shrink-0 text-xl text-yt-text-3">search</span>
            <input
              className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-yt-text outline-none placeholder:text-yt-text-3"
              placeholder="搜索视频、图片、音频…"
              value={localQ}
              onChange={(e) => { setLocalQ(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              enterKeyHint="search"
            />
            {localQ && (
              <button type="button" className="text-yt-text-3 hover:text-yt-text" onClick={() => { setLocalQ(""); setResults([]); }}>
                <span className="material-icons-round text-lg">close</span>
              </button>
            )}
          </div>

          {showResults && localQ.trim() && results.length > 0 && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-xl border border-yt-border bg-yt-surface shadow-lg">
              {results.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-yt-hover"
                  onClick={() => {
                    setShowResults(false);
                    navigate(`/player/${m.id}`);
                  }}
                >
                  <div className="h-9 w-16 shrink-0 overflow-hidden rounded bg-yt-surface-2">
                    {m.thumbnail_url && (
                      <img src={m.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-yt-text">{m.name_no_ext}</p>
                    <p className="text-xs text-yt-text-3">
                      {m.media_type === "video" ? "视频" : m.media_type === "image" ? "图片" : "音频"}
                      {m.duration_formatted ? ` · ${m.duration_formatted}` : ""}
                    </p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-yt-border px-3 py-2 text-xs text-yt-text-2 hover:bg-yt-hover"
                onClick={submitSearch}
              >
                <span className="material-icons-round text-sm">search</span>
                搜索 &ldquo;{localQ.trim()}&rdquo; 的全部结果
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 pr-[max(0.75rem,env(safe-area-inset-right))]">
          {tgActive > 0 && (
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-yt-hover"
              title={`${tgActive} 个文件正在接收`}
              onClick={() => navigate("/settings")}
            >
              <span className="material-icons-round text-blue-400">cloud_download</span>
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                {tgActive}
              </span>
            </button>
          )}
          <button
            type="button"
            disabled={scanStatus?.scanning}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-yt-hover disabled:opacity-50"
            title="扫描新文件"
            onClick={() => triggerScan.mutate(undefined)}
          >
            <span className={`material-icons-round ${scanStatus?.scanning ? "animate-spin" : ""}`}>refresh</span>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-yt-hover"
            onClick={toggleTheme}
            aria-label="主题"
          >
            <span className="material-icons-round text-xl">{theme === "light" ? "dark_mode" : "light_mode"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
