import { useNavigate, useParams } from "react-router-dom";
import { useMediaItem, useRecordPlay, useToggleFavorite } from "../api/library";
import { useLibrary } from "../api/library";
import { AudioPlayerBlock } from "../components/player/AudioPlayerBlock";
import { VideoPlayer } from "../components/player/VideoPlayer";
import { ImageViewer } from "../components/image/ImageViewer";
import { TagEditor } from "../components/media/TagEditor";
import { CommentSection } from "../components/social/CommentSection";
import { ReactionBar } from "../components/social/ReactionBar";
import { usePlayerStore } from "../store/playerStore";
import { useMemo, useState, useEffect } from "react";
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
  const setMiniMedia = usePlayerStore((s) => s.setMiniMedia);
  const closeMini = usePlayerStore((s) => s.closeMini);

  const lq = useLibrary({ type: "video", per_page: 50 });
  const queue = useMemo(() => lq.data?.pages?.flatMap((p) => p.items) ?? [], [lq.data]);
  const [imgOpen, setImgOpen] = useState(true);

  useEffect(() => {
    closeMini();
  }, [mediaId, closeMini]);

  const onBack = () => {
    if (media?.media_type === "video") {
      setMiniMedia(media);
    }
    navigate(-1);
  };

  const toggleFav = useToggleFavorite();

  if (isLoading || !media) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-yt-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (media.media_type === "image") {
    const src = `/api/media/${media.id}/file`;
    return (
      <div className="min-h-[100dvh] bg-yt-bg text-yt-text">
        <div className="mx-auto max-w-5xl px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-4">
          <button type="button" onClick={() => navigate(-1)} className="mb-4 flex min-h-[44px] items-center gap-2 text-yt-text-2 hover:text-yt-text">
            <span className="material-icons-round">arrow_back</span>
            返回
          </button>
          <img
            src={src}
            alt={media.name_no_ext}
            className="max-h-[75vh] w-full cursor-zoom-in rounded-xl object-contain"
            onClick={() => setImgOpen(true)}
          />
          <p className="mt-3 text-lg font-semibold">{media.name_no_ext}</p>
          <div className="mt-3">
            <ReactionBar mediaId={media.id} />
          </div>
          <TagEditor mediaId={media.id} />
          <CommentSection mediaId={media.id} />
        </div>
        <ImageViewer
          open={imgOpen}
          src={src}
          title={media.name_no_ext}
          onClose={() => setImgOpen(false)}
        />
      </div>
    );
  }

  if (media.media_type === "audio") {
    const src = `/api/media/${media.id}/file`;
    return (
      <div className="min-h-[100dvh] bg-yt-bg text-yt-text">
        <div className="mx-auto max-w-xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => navigate(-1)} className="mb-4 flex min-h-[44px] items-center gap-2 text-yt-text-2 hover:text-yt-text">
            <span className="material-icons-round">arrow_back</span>
            返回
          </button>
          <div className="rounded-2xl bg-yt-surface p-6">
            <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-yt-surface-2 to-yt-surface-3">
              <span className="material-icons-round text-6xl text-yt-text-3">audiotrack</span>
            </div>
            <AudioPlayerBlock media={media} src={src} />
          </div>
          <p className="mt-4 text-lg font-semibold">{media.name_no_ext}</p>
          <div className="mt-3">
            <ReactionBar mediaId={media.id} />
          </div>
          <TagEditor mediaId={media.id} />
          <CommentSection mediaId={media.id} />
        </div>
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
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-yt-surface-3">
          <div className="h-full rounded-full bg-yt-red transition-all" style={{ width: `${Math.round(pct)}%` }} />
        </div>
        <p className="text-sm text-yt-text-3">{Math.round(pct)}%</p>
        <Button variant="secondary" onClick={() => refetch()}>刷新状态</Button>
      </div>
    );
  }

  if (media.transcode_status === "failed") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <span className="material-icons-round text-5xl text-red-400">error_outline</span>
        <p className="text-yt-text-2">该视频转码失败</p>
        <Button onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-yt-text sm:px-4 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <VideoPlayer
          mediaItem={media}
          onBack={onBack}
          onEnded={() => {
            if (mediaId) recordPlay.mutate(mediaId);
          }}
        />
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div>
            <h1 className="text-xl font-semibold">{media.name_no_ext}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-yt-text-3">
              {media.width && media.height && (
                <span className="rounded bg-yt-surface px-2 py-0.5">{media.width}×{media.height}</span>
              )}
              {media.duration_formatted && (
                <span className="rounded bg-yt-surface px-2 py-0.5">{media.duration_formatted}</span>
              )}
              {media.video_codec && (
                <span className="rounded bg-yt-surface px-2 py-0.5">{media.video_codec}</span>
              )}
              {media.file_size_formatted && (
                <span className="rounded bg-yt-surface px-2 py-0.5">{media.file_size_formatted}</span>
              )}
              {media.from_telegram && (
                <span className="rounded bg-blue-600/20 px-2 py-0.5 text-blue-400">Telegram</span>
              )}
            </div>
            <p className="mt-2 break-all text-xs text-yt-text-3">{media.file_path}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => toggleFav.mutate(media.id)}
              >
                <span className="material-icons-round text-lg">
                  {media.is_favorite ? "favorite" : "favorite_border"}
                </span>
                {media.is_favorite ? "已收藏" : "收藏"}
              </Button>
            </div>
            <div className="mt-4">
              <ReactionBar mediaId={media.id} />
            </div>
            <TagEditor mediaId={media.id} />
            <CommentSection mediaId={media.id} />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-yt-text-2">接下来</h2>
            <div className="flex flex-col gap-2">
              {queue
                .filter((m) => m.id !== media.id && m.media_type === "video")
                .slice(0, 8)
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="flex gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5"
                    onClick={() => {
                      setCurrentMedia(m, queue, queue.findIndex((x) => x.id === m.id));
                      navigate(`/player/${m.id}`);
                    }}
                  >
                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-yt-surface-2">
                      {m.thumbnail_url && (
                        <img src={m.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      )}
                      {m.duration_formatted && (
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[10px] tabular-nums text-white">
                          {m.duration_formatted}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 py-0.5">
                      <p className="line-clamp-2 text-sm text-yt-text">{m.name_no_ext}</p>
                      <p className="mt-0.5 text-xs text-yt-text-3">{m.file_size_formatted}</p>
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
