import { useState } from "react";
import { useComments, useAddComment, useDeleteComment } from "../../api/comments";
import { Button } from "../ui/Button";

function timeAgo(iso) {
  const d = new Date(iso);
  const now = Date.now();
  const s = Math.floor((now - d.getTime()) / 1000);
  if (s < 60) return "刚刚";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} 天前`;
  return d.toLocaleDateString();
}

function CommentItem({ comment, mediaId, depth = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const addReply = useAddComment(mediaId);
  const del = useDeleteComment(mediaId);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    await addReply.mutateAsync({
      content: replyText.trim(),
      author: replyAuthor.trim() || "用户",
      parent_id: comment.id,
    });
    setReplyText("");
    setReplyAuthor("");
    setShowReply(false);
  };

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-yt-border pl-4" : ""}>
      <div className="group py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yt-surface-2 text-sm font-semibold text-yt-text-2">
            {comment.author.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-yt-text">{comment.author}</span>
              <span className="text-xs text-yt-text-3">{timeAgo(comment.created_at)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-yt-text-2">{comment.content}</p>
            <div className="mt-1.5 flex items-center gap-3">
              {depth === 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-yt-text-3 hover:text-yt-text"
                  onClick={() => setShowReply(!showReply)}
                >
                  <span className="material-icons-round text-sm">reply</span>
                  回复
                </button>
              )}
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-yt-text-3 opacity-0 hover:text-red-400 group-hover:opacity-100"
                onClick={() => del.mutate(comment.id)}
              >
                <span className="material-icons-round text-sm">delete_outline</span>
                删除
              </button>
            </div>
          </div>
        </div>

        {showReply && (
          <div className="ml-11 mt-3 space-y-2">
            <input
              className="w-full rounded-lg border border-yt-border bg-yt-bg px-3 py-2 text-sm outline-none focus:border-yt-accent/60"
              value={replyAuthor}
              onChange={(e) => setReplyAuthor(e.target.value)}
              placeholder="你的名字（可选）"
            />
            <textarea
              className="min-h-[60px] w-full rounded-lg border border-yt-border bg-yt-bg px-3 py-2 text-sm outline-none focus:border-yt-accent/60"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="写下你的回复…"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="!text-xs" onClick={() => setShowReply(false)}>取消</Button>
              <Button className="!text-xs" onClick={submitReply} disabled={addReply.isPending || !replyText.trim()}>
                {addReply.isPending ? "发送中…" : "回复"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {comment.replies?.map((r) => (
        <CommentItem key={r.id} comment={r} mediaId={mediaId} depth={depth + 1} />
      ))}
    </div>
  );
}

export function CommentSection({ mediaId }) {
  const { data, isLoading } = useComments(mediaId);
  const add = useAddComment(mediaId);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [showForm, setShowForm] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    await add.mutateAsync({
      content: text.trim(),
      author: author.trim() || "用户",
    });
    setText("");
    setShowForm(false);
  };

  const comments = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <span className="material-icons-round text-xl text-yt-text-2">chat</span>
          评论
          {total > 0 && <span className="text-sm font-normal text-yt-text-3">({total})</span>}
        </h3>
      </div>

      {!showForm ? (
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-yt-border bg-yt-surface/50 px-4 py-3 text-left text-sm text-yt-text-3 transition-colors hover:bg-yt-surface"
          onClick={() => setShowForm(true)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yt-surface-2">
            <span className="material-icons-round text-lg">person</span>
          </div>
          写下你的评论…
        </button>
      ) : (
        <div className="rounded-xl border border-yt-border bg-yt-surface p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yt-surface-2 text-sm font-semibold text-yt-text-2">
              {(author || "用").charAt(0).toUpperCase()}
            </div>
            <input
              className="flex-1 rounded-lg border border-yt-border bg-yt-bg px-3 py-1.5 text-sm outline-none focus:border-yt-accent/60"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="你的名字（可选）"
            />
          </div>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-yt-border bg-yt-bg px-3 py-2 text-sm outline-none focus:border-yt-accent/60"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你的评论…"
            autoFocus
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); setText(""); }}>取消</Button>
            <Button onClick={submit} disabled={add.isPending || !text.trim()}>
              {add.isPending ? "发送中…" : "发表评论"}
            </Button>
          </div>
        </div>
      )}

      {isLoading && <p className="mt-4 text-sm text-yt-text-3">加载评论…</p>}

      {!isLoading && comments.length === 0 && (
        <p className="mt-6 text-center text-sm text-yt-text-3">还没有评论，来说点什么吧</p>
      )}

      <div className="mt-2 divide-y divide-yt-border">
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} mediaId={mediaId} />
        ))}
      </div>
    </div>
  );
}
