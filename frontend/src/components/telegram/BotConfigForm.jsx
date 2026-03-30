import { useEffect, useState } from "react";
import {
  usePutTelegramConfig,
  useTelegramConfig,
  useTestTelegramChannel,
  useTestTelegramConnection,
} from "../../api/telegram";
import { Button } from "../ui/Button";

const sample = {
  filename: "example.mp4",
  size: "1.2 GB",
  duration: "1:23:45",
  date: "2026-03-30 14:00",
  sender: "Alice",
  media_type: "Video",
  resolution: "1920×1080",
};

export function BotConfigForm() {
  const { data: cfg, refetch } = useTelegramConfig();
  const put = usePutTelegramConfig();
  const testTok = useTestTelegramConnection();
  const testCh = useTestTelegramChannel();

  const [token, setToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [saveDir, setSaveDir] = useState("");
  const [caption, setCaption] = useState("");
  const [allowed, setAllowed] = useState("");
  const [localApi, setLocalApi] = useState("");
  const [autoScan, setAutoScan] = useState(true);
  const [autoTc, setAutoTc] = useState(true);
  const [forward, setForward] = useState(true);
  const [showTok, setShowTok] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!cfg) return;
    setToken(cfg.bot_token_masked || "");
    setChannelId(cfg.channel_id || "");
    setSaveDir(cfg.save_directory || "");
    setCaption(cfg.caption_template || "");
    setAllowed(cfg.allowed_user_ids || "");
    setLocalApi(cfg.local_api_url || "");
    setAutoScan(cfg.auto_scan);
    setAutoTc(cfg.auto_transcode);
    setForward(cfg.forward_to_channel);
    setEnabled(cfg.is_enabled);
  }, [cfg]);

  const previewTpl = (tpl) => {
    let s = tpl || "";
    for (const [k, v] of Object.entries(sample)) {
      s = s.split(`{${k}}`).join(v);
    }
    return s;
  };

  const save = async () => {
    const body = {
      bot_token: token.includes("•") ? undefined : token || undefined,
      channel_id: channelId,
      save_directory: saveDir,
      caption_template: caption,
      allowed_user_ids: allowed,
      local_api_url: localApi || null,
      auto_scan: autoScan,
      auto_transcode: autoTc,
      forward_to_channel: forward,
      is_enabled: enabled,
    };
    await put.mutateAsync(body);
    refetch();
  };

  const toggleEnabled = async (v) => {
    setEnabled(v);
    if (!cfg?.bot_token_masked && !token) return;
    await put.mutateAsync({ is_enabled: v });
    refetch();
  };

  return (
    <div className="space-y-4 rounded-xl border border-yt-border bg-yt-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-yt-text">Telegram Bot</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            disabled={!cfg?.bot_token_masked && !token.trim()}
            onChange={(e) => toggleEnabled(e.target.checked)}
          />
          启用
        </label>
      </div>

      <div>
        <label className="text-xs text-yt-text-2">Bot Token</label>
        <div className="mt-1 flex gap-2">
          <input
            type={showTok ? "text" : "password"}
            className="flex-1 rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="从 @BotFather 获取"
          />
          <button type="button" className="text-sm text-yt-red" onClick={() => setShowTok(!showTok)}>
            {showTok ? "隐藏" : "显示"}
          </button>
          <Button
            variant="secondary"
            className="!px-3 !py-1 !text-xs"
            onClick={() => {
              const t = token.includes("•") ? undefined : token.trim();
              testTok.mutate(t || undefined);
            }}
          >
            测试
          </Button>
        </div>
        {testTok.data?.valid && <p className="mt-1 text-xs text-green-500">已连接 @{testTok.data.bot_username}</p>}
        {testTok.data?.error && <p className="mt-1 text-xs text-red-400">{testTok.data.error}</p>}
      </div>

      <div>
        <label className="text-xs text-yt-text-2">频道 ID</label>
        <div className="mt-1 flex gap-2">
          <input
            className="flex-1 rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="@channel 或 -100..."
          />
          <Button
            variant="secondary"
            className="!px-3 !py-1 !text-xs"
            onClick={() => {
              const t = token.includes("•") ? undefined : token.trim();
              testCh.mutate({ bot_token: t, channel_id: channelId });
            }}
          >
            测试
          </Button>
        </div>
        {testCh.data?.success === false && testCh.data?.error && (
          <p className="mt-1 text-xs text-red-400">{testCh.data.error}</p>
        )}
      </div>

      <div>
        <label className="text-xs text-yt-text-2">保存目录（绝对路径）</label>
        <input
          className="mt-1 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
          value={saveDir}
          onChange={(e) => setSaveDir(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-yt-text-2">说明模板（支持 HTML）</label>
        <textarea
          className="mt-1 min-h-[120px] w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <div className="mt-2 rounded-lg bg-yt-bg p-3 text-xs text-yt-text-2">
          <p className="mb-1 text-yt-text-3">预览</p>
          <div className="whitespace-pre-wrap rounded-md bg-[#1a1a1a] p-3 text-yt-text">{previewTpl(caption)}</div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)} />
          下载后自动扫描媒体库
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autoTc} onChange={(e) => setAutoTc(e.target.checked)} />
          视频自动转码
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={forward} onChange={(e) => setForward(e.target.checked)} />
          转发到频道
        </label>
      </div>

      <div>
        <label className="text-xs text-yt-text-2">允许的用户 ID（逗号分隔，留空表示全部）</label>
        <input
          className="mt-1 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
          value={allowed}
          onChange={(e) => setAllowed(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-yt-text-2">本地 Bot API（&gt;20MB 文件，可选）</label>
        <input
          className="mt-1 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
          value={localApi}
          onChange={(e) => setLocalApi(e.target.value)}
          placeholder="http://127.0.0.1:8081"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={save} disabled={put.isPending}>
          保存配置
        </Button>
      </div>
    </div>
  );
}
