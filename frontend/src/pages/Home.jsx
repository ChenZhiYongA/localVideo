import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddFolder, useFolders } from "../api/folders";
import { useLibrary } from "../api/library";
import { EmptyState } from "../components/media/EmptyState";
import { MediaCard } from "../components/media/MediaCard";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { MediaGridSkeleton, Skeleton } from "../components/ui/Skeleton";
import { HeroBanner } from "../components/home/HeroBanner";
import { MediaRow } from "../components/home/MediaRow";
import { usePlayerStore } from "../store/playerStore";

function continueItems(videos) {
  return videos.filter((m) => {
    const raw = localStorage.getItem(`progress_${m.id}`);
    if (!raw || !m.duration_seconds) return false;
    const t = Number(raw);
    const p = t / m.duration_seconds;
    return p > 0.05 && p < 0.95;
  });
}

const SOURCE_OPTS = [
  { value: "all", label: "全部" },
  { value: "local", label: "本地" },
  { value: "telegram", label: "Telegram" },
];

export function Home() {
  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const [sourceFilter, setSourceFilter] = useState("all");
  const recQ = useLibrary({ type: "all", sort: "recommend", per_page: 36, source: sourceFilter });
  const recentQ = useLibrary({ type: "all", sort: "indexed", per_page: 24, source: sourceFilter });
  const cq = useLibrary({ type: "video", per_page: 100, source: sourceFilter });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");
  const add = useAddFolder();
  const setMiniMedia = usePlayerStore((s) => s.setMiniMedia);

  const recommended = useMemo(() => recQ.data?.pages?.flatMap((p) => p.items) ?? [], [recQ.data]);
  const recentlyAdded = useMemo(() => recentQ.data?.pages?.flatMap((p) => p.items) ?? [], [recentQ.data]);
  const videos = useMemo(() => cq.data?.pages?.flatMap((p) => p.items) ?? [], [cq.data]);
  const cont = useMemo(() => continueItems(videos), [videos]);

  const openPlayer = (m) => navigate(`/player/${m.id}`);

  const addFolder = async () => {
    if (!path.trim()) return;
    await add.mutateAsync(path.trim());
    setPath("");
    setOpen(false);
  };

  if (foldersLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="aspect-[21/9] max-h-[420px] w-full rounded-xl" />
        <div>
          <Skeleton className="mb-3 h-6 w-32" />
          <MediaGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (!folders.length) {
    return (
      <>
        <EmptyState onAddFolder={() => setOpen(true)} />
        <Modal open={open} onClose={() => setOpen(false)} title="添加文件夹">
          <input
            className="mb-4 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="文件夹路径"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={addFolder}>添加</Button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-8">
      {recommended.length > 0 && <HeroBanner items={recommended.slice(0, 8)} />}

      <div className="flex items-center gap-2">
        {SOURCE_OPTS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              sourceFilter === o.value
                ? "bg-yt-text text-yt-bg"
                : "bg-yt-surface-2 text-yt-text-2 hover:bg-yt-surface-3 hover:text-yt-text"
            }`}
            onClick={() => setSourceFilter(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {cont.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold sm:text-lg">继续观看</h2>
          <div className="flex gap-3 overflow-x-auto overscroll-x-contain pb-2 hide-scrollbar sm:gap-4">
            {cont.slice(0, 12).map((m) => (
              <div key={m.id} className="w-[44vw] max-w-[220px] shrink-0 sm:w-52">
                <MediaCard media={m} onClick={() => openPlayer(m)} />
                <div className="relative -mt-2 h-1 overflow-hidden rounded bg-yt-surface-3">
                  <div
                    className="h-full bg-yt-red"
                    style={{
                      width: `${(Number(localStorage.getItem(`progress_${m.id}`)) / (m.duration_seconds || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recQ.isLoading ? (
        <div>
          <Skeleton className="mb-3 h-6 w-32" />
          <MediaGridSkeleton count={10} />
        </div>
      ) : (
        <MediaRow
          title="为你推荐"
          items={recommended.slice(0, 20)}
          moreLink="/library?sort=recommend"
          onPlay={openPlayer}
        />
      )}

      {recentlyAdded.length > 0 && (
        <MediaRow
          title="最近添加"
          items={recentlyAdded.slice(0, 20)}
          moreLink="/library?sort=indexed&order=desc"
          onPlay={openPlayer}
        />
      )}

      {recommended.length > 12 && (
        <section>
          <h2 className="mb-3 text-base font-semibold sm:text-lg">发现更多</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {recommended.slice(12, 24).map((m) => (
              <MediaCard key={m.id} media={m} onClick={() => openPlayer(m)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
