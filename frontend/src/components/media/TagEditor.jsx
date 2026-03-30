import { useEffect, useState } from "react";
import { useMediaTags, useUpdateMediaTags } from "../../api/library";
import { Button } from "../ui/Button";

export function TagEditor({ mediaId }) {
  const { data, isLoading } = useMediaTags(mediaId);
  const save = useUpdateMediaTags();
  const [input, setInput] = useState("");
  const [tags, setTags] = useState([]);

  useEffect(() => {
    setTags(data?.tags || []);
  }, [data?.tags]);

  const norm = (v) => v.trim().replace(/\s+/g, " ").slice(0, 24);

  const addTag = () => {
    const t = norm(input);
    if (!t) return;
    const has = tags.some((x) => x.toLowerCase() === t.toLowerCase());
    if (has || tags.length >= 32) return;
    setTags((prev) => [...prev, t]);
    setInput("");
  };

  const removeTag = (t) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const saveTags = () => {
    save.mutate({ id: mediaId, tags });
  };

  if (isLoading) return <p className="text-xs text-yt-text-2">标签加载中…</p>;

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-yt-border p-3">
      <p className="text-sm font-medium">标签</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-yt-surface-2 px-2.5 py-1 text-xs"
          >
            #{t}
            <button type="button" className="text-yt-text-2 hover:text-yt-text" onClick={() => removeTag(t)}>
              ×
            </button>
          </span>
        ))}
        {!tags.length && <span className="text-xs text-yt-text-2">暂无标签</span>}
      </div>
      <div className="flex gap-2">
        <input
          className="min-h-[40px] flex-1 rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
          value={input}
          placeholder="输入标签后回车或点添加"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button variant="secondary" onClick={addTag}>
          添加
        </Button>
        <Button onClick={saveTags} disabled={save.isPending}>
          保存
        </Button>
      </div>
    </div>
  );
}
