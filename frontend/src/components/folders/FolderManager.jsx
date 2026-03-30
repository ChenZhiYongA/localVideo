import { useState } from "react";
import { useAddFolder, useDeleteFolder, useFolders } from "../../api/folders";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { FolderCard } from "./FolderCard";

export function FolderManager() {
  const { data: folders = [], isLoading } = useFolders();
  const add = useAddFolder();
  const del = useDeleteFolder();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");

  const submit = async () => {
    if (!path.trim()) return;
    await add.mutateAsync(path.trim());
    setPath("");
    setOpen(false);
  };

  if (isLoading) return <p className="text-yt-text-2">加载中…</p>;

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>+ 添加文件夹</Button>
      <div className="grid gap-4 md:grid-cols-2">
        {folders.map((f) => (
          <FolderCard key={f.id} folder={f} onRemove={(id) => del.mutate(id)} />
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="添加文件夹">
        <p className="mb-2 text-sm text-yt-text-2">输入本机上的绝对路径（将递归扫描子目录）</p>
        <input
          className="mb-4 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm text-yt-text outline-none"
          placeholder="例如 D:\Videos 或 /home/user/Videos"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={add.isPending}>
            添加
          </Button>
        </div>
      </Modal>
    </div>
  );
}
