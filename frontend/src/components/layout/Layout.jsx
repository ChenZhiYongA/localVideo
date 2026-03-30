import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useUiStore } from "../../store/uiStore";
import { usePlayerStore } from "../../store/playerStore";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MiniPlayer } from "../player/MiniPlayer";

export function Layout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const miniMedia = usePlayerStore((s) => s.miniMedia);

  const mainPad = collapsed ? "md:pl-[var(--sidebar-w-collapsed)]" : "md:pl-[var(--sidebar-w)]";

  return (
    <div className="min-h-[100dvh] bg-yt-bg text-yt-text">
      <Topbar
        onMenu={() => setMobileOpen((o) => !o)}
        collapsed={collapsed}
      />

      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={closeMobile} />

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="关闭菜单"
          onClick={closeMobile}
        />
      )}

      <main
        className={`min-h-[100dvh] pt-[var(--topbar-stack)] transition-[padding-left] duration-200 ${mainPad}`}
      >
        <div
          className="safe-pb p-3 sm:p-4 md:p-6"
          style={miniMedia ? { paddingBottom: "calc(var(--mini-player-h) + 1rem)" } : undefined}
        >
          <Outlet />
        </div>
      </main>

      <MiniPlayer />
    </div>
  );
}
