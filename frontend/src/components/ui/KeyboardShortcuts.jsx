import { AnimatePresence, motion } from "framer-motion";

const GROUPS = [
  {
    title: "播放控制",
    keys: [
      { key: "Space / K", desc: "播放/暂停" },
      { key: "← / J", desc: "后退 5/10秒" },
      { key: "→ / L", desc: "前进 5/10秒" },
      { key: "0-9", desc: "跳转到对应百分比" },
      { key: "< / >", desc: "降低/提高倍速" },
    ],
  },
  {
    title: "音量与画面",
    keys: [
      { key: "↑ / ↓", desc: "音量增减" },
      { key: "M", desc: "静音切换" },
      { key: "F", desc: "全屏" },
      { key: "P", desc: "画中画" },
    ],
  },
  {
    title: "队列",
    keys: [
      { key: "[", desc: "上一个" },
      { key: "]", desc: "下一个" },
    ],
  },
  {
    title: "全局",
    keys: [
      { key: "/", desc: "聚焦搜索" },
      { key: "?", desc: "快捷键帮助" },
    ],
  },
];

export function KeyboardShortcuts({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-yt-border bg-yt-surface p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">键盘快捷键</h2>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-yt-hover"
                onClick={onClose}
              >
                <span className="material-icons-round text-lg">close</span>
              </button>
            </div>
            <div className="space-y-5">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-yt-text-3">
                    {g.title}
                  </p>
                  <div className="space-y-1.5">
                    {g.keys.map((k) => (
                      <div key={k.key} className="flex items-center justify-between">
                        <span className="text-sm text-yt-text-2">{k.desc}</span>
                        <kbd className="rounded bg-yt-surface-2 px-2 py-0.5 font-mono text-xs text-yt-text">
                          {k.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
