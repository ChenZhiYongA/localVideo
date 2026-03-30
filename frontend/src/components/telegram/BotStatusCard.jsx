import { useTelegramConfig, useTelegramStats } from "../../api/telegram";
import { useScanStore } from "../../store/scanStore";

const STATUS_MAP = {
  online: { icon: "cloud_done", label: "Bot 在线", cls: "text-green-500", pulse: "bg-green-500" },
  error: { icon: "cloud_off", label: "Bot 异常", cls: "text-amber-500", pulse: "bg-amber-500" },
  offline: { icon: "cloud_off", label: "Bot 离线", cls: "text-yt-text-3", pulse: "bg-yt-text-3" },
};

function formatBytes(b) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
}

export function BotStatusCard() {
  const { data: cfg } = useTelegramConfig();
  const { data: stats } = useTelegramStats();
  const tgDownloads = useScanStore((s) => s.tgDownloads);
  const activeCount = useScanStore((s) => s.tgDownloadActive);

  if (!cfg?.is_enabled) return null;

  const st = cfg.bot_status || "offline";
  const info = STATUS_MAP[st] || STATUS_MAP.offline;
  const downloading = tgDownloads.filter((d) => d.status === "downloading");

  return (
    <div className="mb-4 space-y-3">
      <div className="rounded-xl border border-yt-border bg-yt-surface p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={`material-icons-round text-2xl ${info.cls}`}>{info.icon}</span>
            {st === "online" && (
              <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${info.pulse} animate-pulse`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-yt-text">{info.label}</p>
            {cfg.bot_username && <p className="text-xs text-yt-text-2">{cfg.bot_username}</p>}
          </div>
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-600/20 px-2.5 py-1 text-xs text-blue-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
              接收中 {activeCount}
            </span>
          )}
        </div>

        {stats && stats.total_received > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatItem label="已接收" value={stats.total_received} />
            <StatItem label="总大小" value={formatBytes(stats.total_size_bytes)} />
            <StatItem label="成功率" value={`${Math.round(stats.success_rate * 100)}%`} />
            <StatItem
              label="最近接收"
              value={stats.last_received_at ? new Date(stats.last_received_at).toLocaleDateString() : "—"}
            />
          </div>
        )}

        {stats && stats.total_received > 0 && Object.keys(stats.by_type).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(stats.by_type).map(([type, count]) => (
              <span key={type} className="rounded-full bg-yt-surface-2 px-2.5 py-1 text-xs text-yt-text-2">
                {type === "video" ? "视频" : type === "photo" ? "图片" : type === "audio" ? "音频" : type} {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {downloading.length > 0 && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
          <p className="mb-2 text-xs font-medium text-blue-400">正在接收</p>
          {downloading.map((d, i) => (
            <div key={i} className="flex items-center gap-2 py-1 text-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
              <span className="min-w-0 flex-1 truncate text-yt-text">{d.filename}</span>
              <span className="shrink-0 text-yt-text-2">{d.sender}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="rounded-lg bg-yt-bg p-2.5">
      <p className="text-xs text-yt-text-3">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-yt-text">{value}</p>
    </div>
  );
}
