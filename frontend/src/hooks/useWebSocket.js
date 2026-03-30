import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useScanStore } from "../store/scanStore";
import { toast } from "../store/toastStore";

const WS_PATH = "/ws/progress";

function wsBaseUrl() {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  if (import.meta.env.DEV) {
    return `ws://127.0.0.1:8000${WS_PATH}`;
  }
  return `${proto}//${host}${WS_PATH}`;
}

export function useWebSocket() {
  const qc = useQueryClient();
  const updateScanProgress = useScanStore((s) => s.updateScanProgress);
  const updateTranscodeProgress = useScanStore((s) => s.updateTranscodeProgress);
  const setScanComplete = useScanStore((s) => s.setScanComplete);
  const clearTranscode = useScanStore((s) => s.clearTranscode);
  const addTgDownload = useScanStore((s) => s.addTgDownload);
  const completeTgDownload = useScanStore((s) => s.completeTgDownload);
  const failTgDownload = useScanStore((s) => s.failTgDownload);
  const reconnectRef = useRef(null);

  useEffect(() => {
    let ws;
    let closed = false;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(wsBaseUrl());
      } catch {
        reconnectRef.current = window.setTimeout(connect, 3000);
        return;
      }

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "ping") return;
          if (msg.type === "scan_progress") updateScanProgress(msg.data);
          if (msg.type === "transcode_progress") updateTranscodeProgress(msg.data);
          if (msg.type === "transcode_done") {
            clearTranscode(msg.data?.media_id);
            qc.invalidateQueries({ queryKey: ["media", msg.data?.media_id] });
            qc.invalidateQueries({ queryKey: ["library"] });
          }
          if (msg.type === "scan_done") {
            setScanComplete(msg.data);
            qc.invalidateQueries({ queryKey: ["library"] });
            qc.invalidateQueries({ queryKey: ["folders"] });
            qc.invalidateQueries({ queryKey: ["library-stats"] });
            qc.invalidateQueries({ queryKey: ["scan-status"] });
          }
          if (msg.type === "bot_download_start") {
            addTgDownload(msg.data);
            toast.info(`正在接收: ${msg.data?.filename || "文件"}`);
          }
          if (msg.type === "bot_download_done") {
            completeTgDownload(msg.data?.filename);
            toast.success(`已保存: ${msg.data?.filename || "文件"}`);
            qc.invalidateQueries({ queryKey: ["telegram-logs"] });
            qc.invalidateQueries({ queryKey: ["telegram-stats"] });
            qc.invalidateQueries({ queryKey: ["library"] });
          }
          if (msg.type === "bot_download_failed") {
            failTgDownload(msg.data?.filename);
            toast.error(`接收失败: ${msg.data?.filename || "文件"}`);
            qc.invalidateQueries({ queryKey: ["telegram-logs"] });
            qc.invalidateQueries({ queryKey: ["telegram-stats"] });
          }
          if (msg.type === "bot_online" || msg.type === "bot_offline") {
            qc.invalidateQueries({ queryKey: ["telegram-config"] });
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (closed) return;
        reconnectRef.current = window.setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* */
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      try {
        ws?.close();
      } catch {
        /* */
      }
    };
  }, [qc, updateScanProgress, updateTranscodeProgress, setScanComplete, clearTranscode, addTgDownload, completeTgDownload, failTgDownload]);
}
