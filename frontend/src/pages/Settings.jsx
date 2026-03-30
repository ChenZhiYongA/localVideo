import { FolderManager } from "../components/folders/FolderManager";
import { BotConfigForm } from "../components/telegram/BotConfigForm";
import { BotStatusCard } from "../components/telegram/BotStatusCard";
import { MediaLogTable } from "../components/telegram/MediaLogTable";
import { useUiStore } from "../store/uiStore";
import { useClearHls, useClearThumbnails, useFfmpegSettings, usePatchFfmpeg } from "../api/settings";
import { useTriggerScan } from "../api/scan";
import { Button } from "../components/ui/Button";
import { toast } from "../store/toastStore";

function SectionCard({ title, icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-yt-border bg-yt-surface">
      <div className="flex items-center gap-2.5 border-b border-yt-border px-5 py-4">
        <span className="material-icons-round text-xl text-yt-text-2">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Settings() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const libraryView = useUiStore((s) => s.libraryView);
  const setLibraryView = useUiStore((s) => s.setLibraryView);
  const { data: ff } = useFfmpegSettings();
  const patchFf = usePatchFfmpeg();
  const clearHls = useClearHls();
  const clearThumbs = useClearThumbnails();
  const scanAll = useTriggerScan();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <SectionCard title="监视文件夹" icon="folder_open">
        <FolderManager />
      </SectionCard>

      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="material-icons-round text-xl text-yt-text-2">smart_toy</span>
          <h2 className="text-lg font-semibold">Telegram Bot</h2>
        </div>
        <BotStatusCard />
        <BotConfigForm />
        <MediaLogTable />
      </section>

      <SectionCard title="外观" icon="palette">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-yt-text-2">主题</p>
            <div className="flex gap-2">
              {[
                { key: "dark", label: "深色", icon: "dark_mode" },
                { key: "light", label: "浅色", icon: "light_mode" },
                { key: "system", label: "跟随系统", icon: "contrast" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                    theme === t.key || (t.key === "system" && !["dark", "light"].includes(theme))
                      ? "border-yt-red bg-yt-red/10 text-yt-text"
                      : "border-yt-border text-yt-text-2 hover:border-yt-text-3"
                  }`}
                  onClick={() => {
                    if (t.key === "system") {
                      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                      setTheme(dark ? "dark" : "light");
                    } else setTheme(t.key);
                  }}
                >
                  <span className="material-icons-round text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-yt-text-2">默认视图</p>
            <div className="flex gap-2">
              {[
                { key: "grid", label: "网格", icon: "grid_view" },
                { key: "list", label: "列表", icon: "view_list" },
              ].map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                    libraryView === v.key ? "border-yt-red bg-yt-red/10 text-yt-text" : "border-yt-border text-yt-text-2 hover:border-yt-text-3"
                  }`}
                  onClick={() => setLibraryView(v.key)}
                >
                  <span className="material-icons-round text-lg">{v.icon}</span>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="转码" icon="speed">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-yt-text-2">质量预设</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "快速", preset: "fast", crf: "28", desc: "低画质·快速" },
                { label: "均衡", preset: "medium", crf: "23", desc: "标准画质" },
                { label: "高画质", preset: "slow", crf: "18", desc: "高画质·较慢" },
              ].map((x) => (
                <button
                  key={x.label}
                  type="button"
                  className={`rounded-xl border px-4 py-2.5 text-left transition-all ${
                    ff?.preset === x.preset
                      ? "border-yt-red bg-yt-red/10"
                      : "border-yt-border hover:border-yt-text-3"
                  }`}
                  onClick={() => patchFf.mutate({ preset: x.preset, crf: x.crf })}
                >
                  <p className="text-sm font-medium">{x.label}</p>
                  <p className="text-xs text-yt-text-3">{x.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-yt-text-3">
            当前：preset {ff?.preset} · CRF {ff?.crf} · 并发 {ff?.transcode_concurrency}
          </p>
          <Button
            variant="secondary"
            onClick={() => clearHls.mutate(undefined, { onSuccess: () => toast.success("HLS 缓存已清除") })}
            disabled={clearHls.isPending}
          >
            清除 HLS 缓存
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="媒体库" icon="perm_media">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => scanAll.mutate(undefined, { onSuccess: () => toast.info("扫描任务已启动") })}
            disabled={scanAll.isPending}
          >
            <span className="material-icons-round text-lg">refresh</span>
            重新扫描全部文件夹
          </Button>
          <Button
            variant="secondary"
            onClick={() => clearThumbs.mutate(undefined, { onSuccess: () => toast.success("缩略图缓存已清除") })}
            disabled={clearThumbs.isPending}
          >
            <span className="material-icons-round text-lg">delete_sweep</span>
            清除缩略图缓存
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="关于" icon="info">
        <div className="space-y-1.5 text-sm text-yt-text-2">
          <p>LocalTube v1.0.0</p>
          <p>后端：FastAPI · 前端：React + Vite + Tailwind</p>
          <p>数据目录：~/.localtube</p>
          <p className="pt-2 text-xs text-yt-text-3">
            按 <kbd className="rounded bg-yt-surface-2 px-1.5 py-0.5 font-mono text-yt-text">?</kbd> 查看键盘快捷键
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
