import { Link, NavLink, useLocation } from "react-router-dom";
import { useFolders } from "../../api/folders";

function linkCls({ isActive }) {
  return `flex items-center gap-3 rounded-r-md px-4 py-2.5 text-sm transition-colors ${
    isActive
      ? "border-l-2 border-yt-red bg-yt-hover font-medium text-yt-text"
      : "border-l-2 border-transparent text-yt-text-2 hover:bg-yt-hover"
  }`;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { data: folders = [] } = useFolders();
  const loc = useLocation();
  const close = () => onCloseMobile?.();
  const showLabels = !collapsed || mobileOpen;

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-full max-h-[100dvh] border-r border-yt-border bg-yt-bg pt-[var(--topbar-stack)] transition-[transform,width] duration-200 ease-out md:z-40 ${
        collapsed ? "w-16" : "w-[var(--sidebar-w)]"
      } max-md:w-[var(--sidebar-w)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
    >
      <nav className="flex max-h-[calc(100dvh-var(--topbar-stack))] flex-col gap-1 overflow-y-auto overscroll-contain py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <NavLink to="/" className={linkCls} end onClick={close}>
          <span className="material-icons-round shrink-0 text-xl">home</span>
          {showLabels && <span>首页</span>}
        </NavLink>
        <NavLink to="/library" className={linkCls} onClick={close}>
          <span className="material-icons-round shrink-0 text-xl">video_library</span>
          {showLabels && <span>媒体库</span>}
        </NavLink>
        {showLabels && (
          <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-yt-text-3">文件夹</p>
        )}
        {showLabels &&
          folders.map((f) => {
            const active =
              loc.pathname === "/library" &&
              new URLSearchParams(loc.search).get("folder") === String(f.id);
            return (
              <Link
                key={f.id}
                to={`/library?folder=${f.id}`}
                className={linkCls({ isActive: active })}
                onClick={close}
              >
                <span className="material-icons-round shrink-0 text-xl">folder</span>
                <span className="truncate">{f.name}</span>
              </Link>
            );
          })}
        <NavLink to="/settings" className={linkCls} onClick={close}>
          <span className="material-icons-round shrink-0 text-xl">settings</span>
          {showLabels && <span>设置</span>}
        </NavLink>
      </nav>
    </aside>
  );
}
