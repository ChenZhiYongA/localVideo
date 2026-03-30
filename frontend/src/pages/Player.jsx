import { useNavigate, useParams } from "react-router-dom";
import { useMediaItem, useRecordPlay, useToggleFavorite } from "../api/library";
import { useLibrary } from "../api/library";
import { VideoPlayer } from "../components/player/VideoPlayer";
import { ImageViewer } from "../components/image/ImageViewer";
import { usePlayerStore } from "../store/playerStore";
import { useMemo, useState } from "react";
import { Spinner } from "../components/ui/Spinner";
import { useScanStore } from "../store/scanStore";
import { Button } from "../components/ui/Button";

export function Player() {
  const { mediaId } = useParams();
  const navigate = useNavigate();
  const { data: media, isLoading, refetch } = useMediaItem(mediaId);
  const recordPlay = useRecordPlay();
  const tc = useScanStore((s) => s.transcodeById[mediaId]);
  const setCurrentMedia = usePlayerStore((s) => s.setCurrentMedia);

  const lq = useLibrary({ type: "video", per_page: 50 });
  const queue = useMemo(() => lq.data?.pages?.flatMap((p) => p.items) ?? [], [lq.data]);
  const [imgOpen, setImgOpen] = useState(true);

  const onBack = () => navigate(-1);

  const toggleFav = useToggleFavorite();

  if (isLoading || !media) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (media.media_type === "image") {
    const src = `/api/media/${media.id}/file`;
    return (
      <>
        <div className="mx-auto max-w-5xl">
          <button type="button" onClick={onBack} className="mb-4 flex items-center gap-2 text-yt-text-2 hover:text-yt-text">
            <span className="material-icons-round">arrow_back</span>
            返回
          </button>
          <img
            src={src}
            alt={media.name_no_ext}
            className="max-h-[75vh] w-full cursor-zoom-in rounded-lg object-contain"
            onClick={() => setImgOpen(true)}
          />
          <p className="mt-2 text-lg font-medium">{media.name_no_ext}</p>
        </div>
        <ImageViewer
          open={imgOpen}
          src={src}
          title={media.name_no_ext}
          onClose={() => setImgOpen(false)}
        />
      </>
    );
  }

  if (media.media_type === "audio") {
    const src = `/api/media/${media.id}/file`;
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-2 text-yt-text-2 hover:text-yt-text">
          <span className="material-icons-round">arrow_back</span>
          返回
        </button>
        <audio controls className="w-full" src={src} preload="metadata" />
        <p className="mt-4 text-lg font-medium">{media.name_no_ext}</p>
      </div>
    );
  }

  const canPlay = media.transcode_status === "done" || media.transcode_status === "not_needed";
  const pending = !canPlay && media.transcode_status !== "failed";

  if (pending) {
    const pct = tc?.percent ?? media.transcode_progress ?? 0;
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Spinner className="h-14 w-14" />
        <p className="text-lg text-yt-text">正在准备播放…</p>
        <p className="text-sm text-yt-text-2">{Math.round(pct)}%</p>
        <Button variant="secondary" onClick={() => refetch()}>
          刷新状态
        </Button>
      </div>
    );
  }

  if (media.transcode_status === "failed") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-yt-text-2">该视频转码失败</p>
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-yt-text">
      <div className="mx-auto max-w-6xl space-y-6">
      <VideoPlayer
        mediaItem={media}
        onBack={onBack}
        onEnded={() => {
          if (mediaId) recordPlay.mutate(mediaId);
        }}
      />
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div>
          <h1 className="text-xl font-semibold">{media.name_no_ext}</h1>
          <p className="mt-1 break-all text-sm text-yt-text-2">{media.file_path}</p>
          <p className="mt-2 text-sm text-yt-text-2">
            {media.width && media.height ? `${media.width}×${media.height}` : ""}
            {media.duration_formatted ? ` · ${media.duration_formatted}` : ""}
            {media.video_codec ? ` · ${media.video_codec}` : ""}
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => toggleFav.mutate(media.id)}
          >
            {media.is_favorite ? "取消收藏" : "收藏"}
          </Button>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-yt-text-2">接下来</h2>
          <div className="flex flex-col gap-2">
            {queue
              .filter((m) => m.id !== media.id && m.media_type === "video")
              .slice(0, 5)
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="flex gap-2 rounded-lg border border-yt-border p-2 text-left hover:bg-yt-hover"
                  onClick={() => {
                    setCurrentMedia(m, queue, queue.findIndex((x) => x.id === m.id));
                    navigate(`/player/${m.id}`);
                  }}
                >
                  <div className="h-14 w-24 shrink-0 overflow-hidden rounded bg-yt-surface-2">
                    <img src={m.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm">{m.name_no_ext}</p>
                    <p className="text-xs text-yt-text-2">{m.duration_formatted}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
