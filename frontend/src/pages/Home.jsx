import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAddFolder, useFolders } from "../api/folders";
import { useLibrary } from "../api/library";
import { EmptyState } from "../components/media/EmptyState";
import { MediaCard } from "../components/media/MediaCard";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";

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
  { value: "all", label: "混合" },
  { value: "local", label: "本地" },
  { value: "telegram", label: "Telegram" },
];

function libraryRecommendLink(source) {
  const qs = new URLSearchParams();
  qs.set("sort", "recommend");
  if (source !== "all") qs.set("source", source);
  return `/library?${qs.toString()}`;
}

function libraryVideoLink(source) {
  const qs = new URLSearchParams();
  qs.set("type", "video");
  if (source !== "all") qs.set("source", source);
  return `/library?${qs.toString()}`;
}

export function Home() {
  const { data: folders = [] } = useFolders();
  const [sourceFilter, setSourceFilter] = useState("all");
  const recQ = useLibrary({ type: "all", sort: "recommend", per_page: 36, source: sourceFilter });
  const cq = useLibrary({ type: "video", per_page: 100, source: sourceFilter });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");
  const add = useAddFolder();

  const recommended = useMemo(() => recQ.data?.pages?.flatMap((p) => p.items) ?? [], [recQ.data]);
  const videos = useMemo(() => cq.data?.pages?.flatMap((p) => p.items) ?? [], [cq.data]);
  const cont = useMemo(() => continueItems(videos), [videos]);

  const openPlayer = (m) => {
    navigate(`/player/${m.id}`);
  };

  const addFolder = async () => {
    if (!path.trim()) return;
    await add.mutateAsync(path.trim());
    setPath("");
    setOpen(false);
  };

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
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={addFolder}>添加</Button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-10">
      {cont.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">继续观看</h2>
            <Link to={libraryVideoLink(sourceFilter)} className="text-sm text-yt-red">
              查看全部
            </Link>
          </div>
          <div className="-mx-1 flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2 [-webkit-overflow-scrolling:touch] sm:gap-4">
            {cont.slice(0, 12).map((m) => (
              <div key={m.id} className="w-[42vw] max-w-[14rem] shrink-0 sm:w-56">
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

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">为你推荐</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-yt-border p-0.5">
              {SOURCE_OPTS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`min-h-[40px] rounded-md px-2.5 py-1.5 text-xs sm:text-sm ${
                    sourceFilter === o.value ? "bg-yt-surface-2 text-yt-text" : "text-yt-text-2"
                  }`}
                  onClick={() => setSourceFilter(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <Link to={libraryRecommendLink(sourceFilter)} className="text-sm text-yt-red">
              查看全部
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {recommended.slice(0, 12).map((m) => (
            <MediaCard key={m.id} media={m} onClick={() => openPlayer(m)} />
          ))}
        </div>
      </section>
    </div>
  );
}
