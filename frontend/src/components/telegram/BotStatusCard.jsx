import { useTelegramConfig } from "../../api/telegram";

export function BotStatusCard() {
  const { data: cfg } = useTelegramConfig();
  if (!cfg?.is_enabled) return null;

  const st = cfg.bot_status || "offline";
  const online = st === "online";
  const emoji = online ? "🟢" : st === "error" ? "⚠️" : "🔴";

  return (
    <div className="mb-4 rounded-lg border border-yt-border bg-yt-surface px-4 py-3 text-sm">
      <p className="text-yt-text">
        {emoji} {online ? "Bot 在线" : st === "error" ? "Bot 异常" : "Bot 离线"}
        {cfg.bot_username ? ` · ${cfg.bot_username}` : ""}
      </p>
      <p className="mt-1 text-xs text-yt-text-2">保存目录: {cfg.save_directory || "—"}</p>
    </div>
  );
}
