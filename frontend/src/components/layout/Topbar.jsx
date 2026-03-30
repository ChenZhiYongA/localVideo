import { useNavigate, useSearchParams } from "react-router-dom";
import { useScanStatus, useTriggerScan } from "../../api/scan";
import { useUiStore } from "../../store/uiStore";
import { useState } from "react";

export function Topbar({ onMenu }) {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [localQ, setLocalQ] = useState(q);
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const { data: scanStatus } = useScanStatus();
  const triggerScan = useTriggerScan();

  const submitSearch = () => {
    const s = localQ.trim();
    if (s) navigate(`/library?q=${encodeURIComponent(s)}`);
    else navigate("/library");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-yt-border bg-yt-bg pt-[env(safe-area-inset-top,0px)]">
      <div className="flex h-[var(--topbar-h)] items-center gap-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:gap-3 sm:pr-4 md:pl-[calc(var(--sidebar-w)+12px)]">
      <button
        type="button"
        className="flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full hover:bg-yt-hover md:hidden"
        onClick={onMenu}
        aria-label="菜单"
      >
        <span className="material-icons-round">menu</span>
      </button>
      <span className="hidden shrink-0 font-semibold text-yt-text md:inline">LocalTube</span>
      <div className="mx-auto flex min-w-0 max-w-[560px] flex-1 items-center rounded-full border border-yt-border bg-yt-surface px-2 py-1.5 sm:px-3">
        <button type="button" onClick={submitSearch} className="shrink-0 text-yt-text-3" aria-label="搜索">
          <span className="material-icons-round text-[22px] sm:text-[24px]">search</span>
        </button>
        <input
          className="ml-1 min-w-0 flex-1 bg-transparent text-base text-yt-text outline-none placeholder:text-yt-text-3 sm:text-sm"
          placeholder="搜索媒体"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          enterKeyHint="search"
        />
        {localQ && (
          <button type="button" className="text-yt-text-2" onClick={() => setLocalQ("")} aria-label="清除">
            <span className="material-icons-round text-lg">close</span>
          </button>
        )}
      </div>
      <button
        type="button"
        className="flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full hover:bg-yt-hover"
        onClick={toggleTheme}
        aria-label="主题"
      >
        <span className="material-icons-round">{theme === "light" ? "dark_mode" : "light_mode"}</span>
      </button>
      <button
        type="button"
        disabled={scanStatus?.scanning}
        className="flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full hover:bg-yt-hover disabled:opacity-50"
        title="扫描新文件"
        onClick={() => triggerScan.mutate(undefined)}
      >
        <span className={`material-icons-round ${scanStatus?.scanning ? "animate-spin" : ""}`}>refresh</span>
      </button>
      </div>
    </header>
  );
}
