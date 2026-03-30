import { useReactions, useToggleReaction } from "../../api/comments";

const EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "👏"];

export function ReactionBar({ mediaId }) {
  const { data } = useReactions(mediaId);
  const toggle = useToggleReaction(mediaId);

  const counts = {};
  if (data?.items) {
    for (const item of data.items) {
      counts[item.emoji] = item.count;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji] || 0;
        return (
          <button
            key={emoji}
            type="button"
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all active:scale-95 ${
              count > 0
                ? "border-yt-accent/30 bg-yt-accent/10 text-yt-text"
                : "border-yt-border bg-yt-surface text-yt-text-2 hover:border-yt-text-3"
            }`}
            onClick={() => toggle.mutate(emoji)}
            disabled={toggle.isPending}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
          </button>
        );
      })}
      {data?.total > 0 && (
        <span className="text-xs text-yt-text-3">{data.total} 次反应</span>
      )}
    </div>
  );
}
