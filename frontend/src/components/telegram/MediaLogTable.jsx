import { useState } from "react";
import { useClearTelegramLogs, useTelegramLogs } from "../../api/telegram";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function MediaLogTable() {
  const [page, setPage] = useState(1);
  const [clearOpen, setClearOpen] = useState(false);
  const { data, isLoading } = useTelegramLogs({ page, per_page: 20 });
  const clear = useClearTelegramLogs();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-yt-text">最近接收</h3>
        <Button variant="ghost" className="!px-2 !py-1 !text-xs !text-red-400" onClick={() => setClearOpen(true)}>
          清空日志
        </Button>
      </div>
      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="确认清空">
        <p className="mb-4 text-sm text-yt-text-2">将删除所有 Telegram 接收记录。</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setClearOpen(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              clear.mutate();
              setClearOpen(false);
            }}
          >
            删除
          </Button>
        </div>
      </Modal>
      {isLoading && <p className="text-yt-text-2">加载中…</p>}
      {!isLoading && !items.length && <p className="text-sm text-yt-text-2">暂无记录</p>}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-yt-border">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-yt-surface-2 text-yt-text-2">
              <tr>
                <th className="px-2 py-2">时间</th>
                <th className="px-2 py-2">发送者</th>
                <th className="px-2 py-2">文件名</th>
                <th className="px-2 py-2">类型</th>
                <th className="px-2 py-2">状态</th>
                <th className="px-2 py-2">频道</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-yt-border">
                  <td className="px-2 py-2 text-yt-text-2">{new Date(r.received_at).toLocaleString()}</td>
                  <td className="px-2 py-2">{r.sender_name}</td>
                  <td className="px-2 py-2">{r.original_filename}</td>
                  <td className="px-2 py-2">{r.media_type}</td>
                  <td className="px-2 py-2">
                    <span
                      className={
                        r.status === "done"
                          ? "text-green-500"
                          : r.status === "failed"
                            ? "text-red-400"
                            : "text-yt-text-2"
                      }
                      title={r.error_message || ""}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {r.channel_url ? (
                      <a href={r.channel_url} target="_blank" rel="noreferrer" className="text-yt-red">
                        打开
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-2 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="text-sm text-yt-red disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </button>
          <span className="text-sm text-yt-text-2">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="text-sm text-yt-red disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
