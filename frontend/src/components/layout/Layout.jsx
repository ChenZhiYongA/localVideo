import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useUiStore } from "../../store/uiStore";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Layout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  const mainPad = collapsed ? "md:pl-16" : "md:pl-[var(--sidebar-w)]";

  return (
    <div className="min-h-screen min-h-[100dvh] bg-yt-bg text-yt-text">
      <Topbar onMenu={() => setMobileOpen((o) => !o)} />
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
        className={`min-h-screen min-h-[100dvh] pt-[var(--topbar-stack)] transition-[padding] ${mainPad}`}
      >
        <div className="safe-pb p-3 sm:p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
