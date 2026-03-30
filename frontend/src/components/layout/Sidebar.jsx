import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useFolders } from "../../api/folders";
import { useScanStore } from "../../store/scanStore";

function SidebarLink({ to, icon, label, collapsed, onClick, active, badge }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-yt-hover font-medium text-yt-text"
          : "text-yt-text-2 hover:bg-yt-hover hover:text-yt-text"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-yt-red" />
      )}
      <span className="material-icons-round shrink-0 text-xl">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {badge && !collapsed && (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {badge && collapsed && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { data: folders = [] } = useFolders();
  const loc = useLocation();
  const [params] = useSearchParams();
  const close = () => onCloseMobile?.();
  const showLabels = !collapsed || mobileOpen;
  const tgActive = useScanStore((s) => s.tgDownloadActive);

  const isHome = loc.pathname === "/";
  const isLibrary =
    loc.pathname === "/library" &&
    !params.get("favorites_only") &&
    !params.get("folder");
  const isFavorites = loc.pathname === "/library" && params.get("favorites_only") === "1";
  const isSettings = loc.pathname === "/settings";
  const activeFolder = loc.pathname === "/library" ? params.get("folder") : null;

  return (
    <aside
      className={`fixed left-0 top-[var(--topbar-stack)] z-50 h-[calc(100dvh-var(--topbar-stack))] border-r border-yt-border bg-yt-bg transition-[transform,width] duration-200 ease-out md:z-40 ${
        collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]"
      } max-md:w-[var(--sidebar-w)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
    >
      <nav className="flex h-full flex-col gap-0.5 overflow-y-auto overscroll-contain px-2 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] hide-scrollbar">
        <SidebarLink
          to="/"
          icon="home"
          label="首页"
          collapsed={collapsed && !mobileOpen}
          onClick={close}
          active={isHome}
        />
        <SidebarLink
          to="/library"
          icon="video_library"
          label="媒体库"
          collapsed={collapsed && !mobileOpen}
          onClick={close}
          active={isLibrary}
        />
        <SidebarLink
          to="/library?favorites_only=1"
          icon="favorite"
          label="收藏"
          collapsed={collapsed && !mobileOpen}
          onClick={close}
          active={isFavorites}
        />

        {showLabels && folders.length > 0 && (
          <div className="mb-1 mt-4 px-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-yt-text-3">文件夹</p>
          </div>
        )}
        {showLabels &&
          folders.map((f) => (
            <SidebarLink
              key={f.id}
              to={`/library?folder=${f.id}`}
              icon="folder"
              label={f.name}
              collapsed={false}
              onClick={close}
              active={activeFolder === String(f.id)}
            />
          ))}

        <div className="mt-auto" />

        <SidebarLink
          to="/settings"
          icon="settings"
          label="设置"
          collapsed={collapsed && !mobileOpen}
          onClick={close}
          active={isSettings}
          badge={tgActive > 0 ? tgActive : undefined}
        />
      </nav>
    </aside>
  );
}
