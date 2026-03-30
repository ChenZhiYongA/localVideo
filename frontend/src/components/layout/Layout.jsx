import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useUiStore } from "../../store/uiStore";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Layout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-yt-bg text-yt-text">
      <Topbar onMenu={() => setMobileOpen((o) => !o)} />
      <Sidebar collapsed={collapsed} />
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="关闭菜单"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <main
        className={`min-h-screen pt-[var(--topbar-h)] transition-[padding] md:pl-[var(--sidebar-w)] ${
          mobileOpen ? "pl-[var(--sidebar-w)]" : ""
        }`}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
