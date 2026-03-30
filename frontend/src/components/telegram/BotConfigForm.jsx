import { useEffect, useState } from "react";
import {
  usePutTelegramConfig,
  useTelegramConfig,
  useTestTelegramChannel,
  useTestTelegramConnection,
} from "../../api/telegram";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";
import { toast } from "../../store/toastStore";

const SAMPLE = {
  filename: "example.mp4",
  size: "1.2 GB",
  duration: "1:23:45",
  date: "2026-03-30 14:00",
  sender: "Alice",
  media_type: "Video",
  resolution: "1920×1080",
};

const TEMPLATE_VARS = [
  { key: "filename", desc: "文件名" },
  { key: "size", desc: "文件大小" },
  { key: "duration", desc: "时长" },
  { key: "date", desc: "日期" },
  { key: "sender", desc: "发送者" },
  { key: "media_type", desc: "媒体类型" },
  { key: "resolution", desc: "分辨率" },
];

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-yt-border last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-yt-text hover:bg-yt-hover"
        onClick={() => setOpen(!open)}
      >
        <span className="material-icons-round text-lg text-yt-text-2">{icon}</span>
        <span className="flex-1">{title}</span>
        <span className={`material-icons-round text-lg text-yt-text-3 transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </div>
  );
}

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
    for (const [k, v] of Object.entries(SAMPLE)) {
      s = s.split(`{${k}}`).join(v);
    }
    return s;
  };

  const save = async () => {
    try {
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
      toast.success("配置已保存");
    } catch {
      toast.error("保存失败");
    }
  };

  const toggleEnabled = async (v) => {
    setEnabled(v);
    if (!cfg?.bot_token_masked && !token) return;
    try {
      await put.mutateAsync({ is_enabled: v });
      refetch();
      toast.success(v ? "Bot 已启用" : "Bot 已停用");
    } catch {
      toast.error("操作失败");
      setEnabled(!v);
    }
  };

  const handleTestToken = () => {
    const t = token.includes("•") ? undefined : token.trim();
    testTok.mutate(t || undefined);
  };

  const handleTestChannel = () => {
    const t = token.includes("•") ? undefined : token.trim();
    testCh.mutate({ bot_token: t, channel_id: channelId });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-yt-border bg-yt-surface">
      <div className="flex items-center justify-between border-b border-yt-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-icons-round text-xl text-yt-text-2">smart_toy</span>
          <h3 className="font-semibold text-yt-text">Telegram Bot</h3>
        </div>
        <Switch
          checked={enabled}
          disabled={!cfg?.bot_token_masked && !token.trim()}
          onChange={toggleEnabled}
          label={enabled ? "已启用" : "已停用"}
        />
      </div>

      <Section title="连接设置" icon="link" defaultOpen={true}>
        <div>
          <label className="text-xs font-medium text-yt-text-2">Bot Token</label>
          <div className="mt-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showTok ? "text" : "password"}
                className="w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 pr-16 text-sm"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="从 @BotFather 获取"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-yt-text-3 hover:text-yt-text"
                onClick={() => setShowTok(!showTok)}
              >
                {showTok ? "隐藏" : "显示"}
              </button>
            </div>
            <Button variant="secondary" className="!px-3 !text-xs" onClick={handleTestToken} disabled={testTok.isPending}>
              {testTok.isPending ? "测试中…" : "测试"}
            </Button>
          </div>
          {testTok.data?.valid && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-green-500">
              <span className="material-icons-round text-sm">check_circle</span>
              已连接 @{testTok.data.bot_username}
            </p>
          )}
          {testTok.data?.error && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
              <span className="material-icons-round text-sm">error</span>
              {testTok.data.error}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-yt-text-2">频道 ID</label>
          <div className="mt-1 flex gap-2">
            <input
              className="flex-1 rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="@channel 或 -100..."
            />
            <Button variant="secondary" className="!px-3 !text-xs" onClick={handleTestChannel} disabled={testCh.isPending}>
              {testCh.isPending ? "测试中…" : "测试"}
            </Button>
          </div>
          {testCh.data?.success === true && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-green-500">
              <span className="material-icons-round text-sm">check_circle</span>
              频道连接正常
            </p>
          )}
          {testCh.data?.success === false && testCh.data?.error && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
              <span className="material-icons-round text-sm">error</span>
              {testCh.data.error}
            </p>
          )}
        </div>
      </Section>

      <Section title="存储设置" icon="folder" defaultOpen={true}>
        <div>
          <label className="text-xs font-medium text-yt-text-2">保存目录（绝对路径）</label>
          <input
            className="mt-1 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
            value={saveDir}
            onChange={(e) => setSaveDir(e.target.value)}
            placeholder="/path/to/telegram-downloads"
          />
        </div>
        <div className="space-y-2.5">
          <Switch checked={autoScan} onChange={setAutoScan} label="下载后自动扫描媒体库" />
          <Switch checked={autoTc} onChange={setAutoTc} label="视频自动转码" />
        </div>
      </Section>

      <Section title="频道转发" icon="forward" defaultOpen={forward}>
        <Switch checked={forward} onChange={setForward} label="将接收的媒体转发到频道" />
        {forward && (
          <div>
            <label className="text-xs font-medium text-yt-text-2">说明模板（支持 HTML）</label>
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 font-mono text-sm"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {TEMPLATE_VARS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className="rounded bg-yt-surface-2 px-2 py-0.5 text-xs text-yt-text-2 hover:bg-yt-surface-3 hover:text-yt-text"
                  onClick={() => setCaption((c) => c + `{${v.key}}`)}
                  title={v.desc}
                >
                  {`{${v.key}}`}
                </button>
              ))}
            </div>
            {caption && (
              <div className="mt-2 rounded-lg bg-yt-bg p-3">
                <p className="mb-1 text-xs text-yt-text-3">预览</p>
                <div className="whitespace-pre-wrap rounded-md bg-[#1a1a1a] p-3 text-xs text-yt-text">
                  {previewTpl(caption)}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="高级设置" icon="tune" defaultOpen={false}>
        <div>
          <label className="text-xs font-medium text-yt-text-2">允许的用户 ID（逗号分隔，留空表示全部）</label>
          <input
            className="mt-1 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
            value={allowed}
            onChange={(e) => setAllowed(e.target.value)}
            placeholder="123456789, 987654321"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-yt-text-2">本地 Bot API（大于 20MB 文件，可选）</label>
          <input
            className="mt-1 w-full rounded-md border border-yt-border bg-yt-bg px-3 py-2 text-sm"
            value={localApi}
            onChange={(e) => setLocalApi(e.target.value)}
            placeholder="http://127.0.0.1:8081"
          />
          <p className="mt-1 text-xs text-yt-text-3">
            Telegram 官方 Bot API 限制下载文件最大 20MB，配置本地 API 后可接收更大文件
          </p>
        </div>
      </Section>

      <div className="flex justify-end border-t border-yt-border px-4 py-3">
        <Button onClick={save} disabled={put.isPending}>
          {put.isPending ? "保存中…" : "保存配置"}
        </Button>
      </div>
    </div>
  );
}
