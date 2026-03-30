import { Link, NavLink, useLocation } from "react-router-dom";
import { useFolders } from "../../api/folders";

function linkCls({ isActive }) {
  return `flex items-center gap-3 rounded-r-md px-4 py-2.5 text-sm transition-colors ${
    isActive
      ? "border-l-2 border-yt-red bg-yt-hover font-medium text-yt-text"
      : "border-l-2 border-transparent text-yt-text-2 hover:bg-yt-hover"
  }`;
}

export function Sidebar({ collapsed }) {
  const { data: folders = [] } = useFolders();
  const loc = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-full border-r border-yt-border bg-yt-bg pt-[var(--topbar-h)] transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-[var(--sidebar-w)]"
      }`}
    >
      <nav className="flex flex-col gap-1 py-4">
        <NavLink to="/" className={linkCls} end>
          <span className="material-icons-round text-xl">home</span>
          {!collapsed && <span>首页</span>}
        </NavLink>
        <NavLink to="/library" className={linkCls}>
          <span className="material-icons-round text-xl">video_library</span>
          {!collapsed && <span>媒体库</span>}
        </NavLink>
        {!collapsed && (
          <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-yt-text-3">文件夹</p>
        )}
        {!collapsed &&
          folders.map((f) => {
            const active =
              loc.pathname === "/library" &&
              new URLSearchParams(loc.search).get("folder") === String(f.id);
            return (
              <Link key={f.id} to={`/library?folder=${f.id}`} className={linkCls({ isActive: active })}>
                <span className="material-icons-round text-xl">folder</span>
                <span className="truncate">{f.name}</span>
              </Link>
            );
          })}
        <NavLink to="/settings" className={linkCls}>
          <span className="material-icons-round text-xl">settings</span>
          {!collapsed && <span>设置</span>}
        </NavLink>
      </nav>
    </aside>
  );
}
