import { useState } from "react";
import { useClearTelegramLogs, useTelegramLogs } from "../../api/telegram";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { toast } from "../../store/toastStore";

const STATUS_LABELS = {
  done: { text: "完成", cls: "text-green-500" },
  failed: { text: "失败", cls: "text-red-400" },
  downloading: { text: "下载中", cls: "text-blue-400" },
  pending: { text: "等待中", cls: "text-yt-text-2" },
};

const STATUS_FILTERS = [
  { value: undefined, label: "全部状态" },
  { value: "done", label: "完成" },
  { value: "failed", label: "失败" },
  { value: "downloading", label: "下载中" },
];

const TYPE_FILTERS = [
  { value: undefined, label: "全部类型" },
  { value: "video", label: "视频" },
  { value: "photo", label: "图片" },
  { value: "audio", label: "音频" },
];

function TypeIcon({ type }) {
  const icon = type === "video" ? "movie" : type === "audio" ? "audiotrack" : type === "photo" ? "image" : "description";
  return <span className="material-icons-round text-sm text-yt-text-3">{icon}</span>;
}

export function MediaLogTable() {
  const [page, setPage] = useState(1);
  const [clearOpen, setClearOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState(undefined);

  const { data, isLoading } = useTelegramLogs({
    page,
    per_page: 20,
    status: statusFilter,
    media_type: typeFilter,
  });
  const clear = useClearTelegramLogs();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const handleClear = () => {
    clear.mutate(undefined, {
      onSuccess: () => toast.success("日志已清空"),
    });
    setClearOpen(false);
  };

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-yt-text">
          接收记录
          {total > 0 && <span className="ml-1.5 font-normal text-yt-text-3">({total})</span>}
        </h3>
        <Button variant="ghost" className="!px-2 !py-1 !text-xs !text-red-400" onClick={() => setClearOpen(true)}>
          清空日志
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="flex rounded-lg border border-yt-border p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                statusFilter === f.value ? "bg-yt-surface-2 text-yt-text" : "text-yt-text-2 hover:text-yt-text"
              }`}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-yt-border p-0.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                typeFilter === f.value ? "bg-yt-surface-2 text-yt-text" : "text-yt-text-2 hover:text-yt-text"
              }`}
              onClick={() => { setTypeFilter(f.value); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="确认清空">
        <p className="mb-4 text-sm text-yt-text-2">将删除所有 Telegram 接收记录，此操作不可撤销。</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setClearOpen(false)}>取消</Button>
          <Button onClick={handleClear}>删除</Button>
        </div>
      </Modal>

      {isLoading && <p className="py-4 text-center text-sm text-yt-text-2">加载中…</p>}
      {!isLoading && !items.length && (
        <div className="flex flex-col items-center gap-2 py-8 text-yt-text-3">
          <span className="material-icons-round text-4xl">inbox</span>
          <p className="text-sm">暂无记录</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-yt-border">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-yt-surface-2 text-yt-text-2">
              <tr>
                <th className="px-3 py-2.5 font-medium">时间</th>
                <th className="px-3 py-2.5 font-medium">发送者</th>
                <th className="px-3 py-2.5 font-medium">文件名</th>
                <th className="px-3 py-2.5 font-medium">类型</th>
                <th className="px-3 py-2.5 font-medium">大小</th>
                <th className="px-3 py-2.5 font-medium">状态</th>
                <th className="px-3 py-2.5 font-medium">频道</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const st = STATUS_LABELS[r.status] || { text: r.status, cls: "text-yt-text-2" };
                return (
                  <tr key={r.id} className="border-t border-yt-border transition-colors hover:bg-yt-hover">
                    <td className="whitespace-nowrap px-3 py-2.5 text-yt-text-2">
                      {new Date(r.received_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">{r.sender_name}</td>
                    <td className="max-w-[200px] truncate px-3 py-2.5" title={r.original_filename}>
                      {r.original_filename}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1">
                        <TypeIcon type={r.media_type} />
                        {r.media_type === "video" ? "视频" : r.media_type === "photo" ? "图片" : r.media_type === "audio" ? "音频" : r.media_type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-yt-text-2">
                      {r.file_size_formatted || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 ${st.cls}`} title={r.error_message || ""}>
                        {r.status === "downloading" && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                        )}
                        {st.text}
                      </span>
                      {r.status === "failed" && r.error_message && (
                        <p className="mt-0.5 max-w-[160px] truncate text-[10px] text-red-400/70" title={r.error_message}>
                          {r.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {r.channel_url ? (
                        <a
                          href={r.channel_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-yt-red hover:underline"
                        >
                          <span className="material-icons-round text-sm">open_in_new</span>
                          打开
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            className="flex items-center gap-1 text-sm text-yt-text-2 transition-colors hover:text-yt-text disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
          >
            <span className="material-icons-round text-lg">chevron_left</span>
            上一页
          </button>
          <span className="min-w-[60px] text-center text-sm text-yt-text-2">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="flex items-center gap-1 text-sm text-yt-text-2 transition-colors hover:text-yt-text disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
            <span className="material-icons-round text-lg">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
