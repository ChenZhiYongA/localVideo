import { FolderManager } from "../components/folders/FolderManager";
import { BotConfigForm } from "../components/telegram/BotConfigForm";
import { BotStatusCard } from "../components/telegram/BotStatusCard";
import { MediaLogTable } from "../components/telegram/MediaLogTable";
import { useUiStore } from "../store/uiStore";
import { useClearHls, useClearThumbnails, useFfmpegSettings, usePatchFfmpeg } from "../api/settings";
import { useTriggerScan } from "../api/scan";
import { Button } from "../components/ui/Button";

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
    <div className="mx-auto max-w-3xl space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-semibold">监视文件夹</h2>
        <FolderManager />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Telegram Bot</h2>
        <BotStatusCard />
        <BotConfigForm />
        <MediaLogTable />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">外观</h2>
        <div className="flex flex-wrap gap-2">
          {["dark", "light", "system"].map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg border px-4 py-2 text-sm ${
                theme === t || (t === "system" && !["dark", "light"].includes(theme))
                  ? "border-yt-red bg-yt-surface-2"
                  : "border-yt-border"
              }`}
              onClick={() => {
                if (t === "system") {
                  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  setTheme(dark ? "dark" : "light");
                } else setTheme(t);
              }}
            >
              {t === "dark" ? "深色" : t === "light" ? "浅色" : "跟随系统"}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-yt-text-2">默认视图</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm ${libraryView === "grid" ? "border-yt-red" : "border-yt-border"}`}
            onClick={() => setLibraryView("grid")}
          >
            网格
          </button>
          <button
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm ${libraryView === "list" ? "border-yt-red" : "border-yt-border"}`}
            onClick={() => setLibraryView("list")}
          >
            列表
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">转码</h2>
        <p className="mb-2 text-sm text-yt-text-2">质量预设（FFmpeg preset / CRF）</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "快速", preset: "fast", crf: "28" },
            { label: "均衡", preset: "medium", crf: "23" },
            { label: "高画质", preset: "slow", crf: "18" },
          ].map((x) => (
            <Button
              key={x.label}
              variant="secondary"
              className="!text-xs"
              onClick={() => patchFf.mutate({ preset: x.preset, crf: x.crf })}
            >
              {x.label}
            </Button>
          ))}
        </div>
        <p className="mt-4 text-xs text-yt-text-3">
          当前：preset {ff?.preset} · CRF {ff?.crf} · 并发 {ff?.transcode_concurrency}
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => clearHls.mutate()} disabled={clearHls.isPending}>
          清除 HLS 缓存
        </Button>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">媒体库</h2>
        <Button variant="secondary" onClick={() => scanAll.mutate(undefined)} disabled={scanAll.isPending}>
          重新扫描全部文件夹
        </Button>
        <Button className="ml-2" variant="secondary" onClick={() => clearThumbs.mutate()} disabled={clearThumbs.isPending}>
          清除缩略图缓存
        </Button>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">关于</h2>
        <p className="text-sm text-yt-text-2">版本 1.0.0</p>
        <p className="text-sm text-yt-text-2">后端：FastAPI · 前端：React + Vite + Tailwind</p>
        <p className="text-sm text-yt-text-2">数据目录：~/.localtube（SQLite、缩略图、HLS）</p>
      </section>
    </div>
  );
}
