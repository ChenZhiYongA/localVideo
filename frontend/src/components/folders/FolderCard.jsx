import { useTriggerScan } from "../../api/scan";
import { Button } from "../ui/Button";

export function FolderCard({ folder, onRemove }) {
  const triggerScan = useTriggerScan();

  return (
    <div className="rounded-xl border border-yt-border bg-yt-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-yt-text">{folder.name}</h3>
          <p className="mt-1 break-all text-xs text-yt-text-2">{folder.path}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="!px-3 !py-1.5 text-xs"
            onClick={() => triggerScan.mutate(folder.id)}
          >
            重新扫描
          </Button>
          <Button variant="ghost" className="!px-3 !py-1.5 text-xs text-red-400" onClick={() => onRemove(folder.id)}>
            移除
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-yt-text-2">
        共 {folder.total_files} 个文件 · 视频 {folder.video_count} · 图片 {folder.image_count}
        {folder.last_scanned && ` · 上次扫描 ${folder.last_scanned}`}
      </p>
    </div>
  );
}
