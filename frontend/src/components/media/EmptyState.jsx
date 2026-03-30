import { Button } from "../ui/Button";

export function EmptyState({ onAddFolder }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="material-icons-round text-7xl text-yt-text-3">folder_open</span>
      <h2 className="mt-6 text-xl font-semibold text-yt-text">添加第一个媒体文件夹</h2>
      <p className="mt-2 max-w-md text-sm text-yt-text-2">
        LocalTube 会扫描并索引其中的视频与图片，生成缩略图并转码以便流畅播放。
      </p>
      <Button className="mt-8" onClick={onAddFolder}>
        添加文件夹
      </Button>
    </div>
  );
}
