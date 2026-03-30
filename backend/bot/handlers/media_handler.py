import html
import logging
import os
from datetime import datetime
from typing import Any

from sqlmodel import Session, select
from telegram import Update
from telegram.ext import ContextTypes

from bot.services.downloader import download_file
from bot.services.forwarder import forward_to_channel
from config import settings
from database import engine
from models import TelegramConfig, TelegramMediaLog
from routers import ws as ws_router
from services.telegram_ingest import ensure_watched_folder, scan_path_and_get_media_id
from utils.file_utils import format_file_size

logger = logging.getLogger(__name__)

MAX_BOT_DOWNLOAD = 20_000_000


def _allowed(user_id: int, config: TelegramConfig) -> bool:
    raw = (config.allowed_user_ids or "").strip()
    if not raw:
        return True
    ids = {int(x.strip()) for x in raw.split(",") if x.strip().isdigit()}
    return user_id in ids


def _extract_media(update: Update) -> dict[str, Any] | None:
    msg = update.effective_message
    if not msg:
        return None
    if msg.video:
        f = msg.video
        return {
            "file_id": f.file_id,
            "original_filename": f.file_name or f"video_{msg.message_id}.mp4",
            "file_size": f.file_size or 0,
            "duration_sec": f.duration,
            "dl_type": "video",
            "log_label": "video",
        }
    if msg.photo:
        f = msg.photo[-1]
        return {
            "file_id": f.file_id,
            "original_filename": f"photo_{msg.message_id}.jpg",
            "file_size": f.file_size or 0,
            "duration_sec": None,
            "dl_type": "photo",
            "log_label": "photo",
        }
    if msg.audio:
        f = msg.audio
        return {
            "file_id": f.file_id,
            "original_filename": f.file_name or f"audio_{msg.message_id}.mp3",
            "file_size": f.file_size or 0,
            "duration_sec": f.duration,
            "dl_type": "audio",
            "log_label": "audio",
        }
    if msg.voice:
        f = msg.voice
        return {
            "file_id": f.file_id,
            "original_filename": f"voice_{msg.message_id}.ogg",
            "file_size": f.file_size or 0,
            "duration_sec": f.duration,
            "dl_type": "voice",
            "log_label": "audio",
        }
    if msg.document:
        f = msg.document
        mime = f.mime_type or ""
        if mime.startswith("video/"):
            dl = "video"
            lg = "video"
        elif mime.startswith("image/"):
            dl = "photo"
            lg = "photo"
        elif mime.startswith("audio/"):
            dl = "audio"
            lg = "audio"
        else:
            dl = "document"
            lg = "document"
        return {
            "file_id": f.file_id,
            "original_filename": f.file_name or f"file_{msg.message_id}",
            "file_size": f.file_size or 0,
            "duration_sec": None,
            "dl_type": dl,
            "log_label": lg,
        }
    return None


def _sender_name(update: Update) -> str:
    u = update.effective_user
    if not u:
        return "?"
    if u.username:
        return f"@{u.username}"
    parts = [u.first_name or "", u.last_name or ""]
    return " ".join(x for x in parts if x).strip() or str(u.id)


def _display_media_type(dl_type: str) -> str:
    return {
        "video": "Video",
        "photo": "Photo",
        "audio": "Audio",
        "voice": "Audio",
        "document": "Document",
    }.get(dl_type, "Document")


async def handle_media(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    uid = update.effective_user.id
    info = _extract_media(update)
    if not info:
        return

    with Session(engine) as session:
        cfg = session.get(TelegramConfig, 1)
        if not cfg:
            await update.message.reply_text("未配置 Bot。")
            return
        if not cfg.is_enabled:
            await update.message.reply_text("🔴 Bot 已关闭。")
            return
        if not _allowed(uid, cfg):
            await update.message.reply_text("⛔ 未授权。")
            return
        if not (cfg.bot_token or "").strip():
            return
        if not (cfg.save_directory or "").strip():
            await update.message.reply_text("未设置保存目录。")
            return

    fs = int(info["file_size"] or 0)
    use_local = bool((cfg.local_api_url or settings.telegram_local_api_url or "").strip())
    if not use_local and fs > MAX_BOT_DOWNLOAD:
        await update.message.reply_text(
            f"❌ 文件超过 Telegram Bot 默认下载上限（20 MB）。\n"
            f"可配置本地 Bot API（TELEGRAM_LOCAL_API_URL）后重试。"
        )
        await ws_router.broadcast(
            {
                "type": "bot_download_failed",
                "data": {"filename": info["original_filename"], "error": "超过 20MB 限制"},
            }
        )
        return

    status_msg = await update.message.reply_text("⏳ 正在接收…")
    log_id: int | None = None
    saved_path = ""
    media_id_val: str | None = None

    try:
        await ws_router.broadcast(
            {
                "type": "bot_download_start",
                "data": {
                    "filename": info["original_filename"],
                    "size": fs,
                    "sender": _sender_name(update),
                    "media_type": info["log_label"],
                },
            }
        )

        with Session(engine) as session:
            cfg = session.get(TelegramConfig, 1)
            log = TelegramMediaLog(
                sender_id=uid,
                sender_name=_sender_name(update),
                original_filename=info["original_filename"],
                saved_path="",
                file_size=fs,
                media_type=info["log_label"],
                telegram_file_id=info["file_id"],
                status="downloading",
            )
            session.add(log)
            session.commit()
            session.refresh(log)
            log_id = log.id

        saved_path = await download_file(
            context.bot,
            info["file_id"],
            info["original_filename"],
            cfg.save_directory,
            info["dl_type"],
        )
        sp = os.path.normpath(saved_path)
        real_size = os.path.getsize(sp) if os.path.isfile(sp) else fs

        with Session(engine) as session:
            if log_id:
                lg = session.get(TelegramMediaLog, log_id)
                if lg:
                    lg.saved_path = sp
                    lg.file_size = real_size
                    lg.status = "done"
                    session.add(lg)
                    session.commit()

            cfg = session.get(TelegramConfig, 1)
            if cfg and cfg.auto_scan:
                folder = ensure_watched_folder(session, cfg.save_directory)
                media_id_val = await scan_path_and_get_media_id(session, folder, sp)

            if log_id and media_id_val:
                lg = session.get(TelegramMediaLog, log_id)
                if lg:
                    lg.media_id = media_id_val
                    session.add(lg)
                    session.commit()

        ch_mid: int | None = None
        with Session(engine) as session:
            cfg_fwd = session.get(TelegramConfig, 1)
        if cfg_fwd and cfg_fwd.forward_to_channel and (cfg_fwd.channel_id or "").strip():
            meta = {
                "filename": html.escape(info["original_filename"]),
                "size": format_file_size(real_size),
                "duration": "",
                "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
                "sender": html.escape(_sender_name(update)),
                "media_type": _display_media_type(info["dl_type"]),
                "resolution": "",
            }
            if info.get("duration_sec"):
                ds = int(info["duration_sec"])
                meta["duration"] = f"{ds // 60}:{ds % 60:02d}"
            try:
                ch_mid = await forward_to_channel(context.bot, update, cfg_fwd, sp, meta)
            except Exception as e:
                logger.warning("forward channel: %s", e)
            if ch_mid and log_id:
                with Session(engine) as session:
                    lg = session.get(TelegramMediaLog, log_id)
                    if lg:
                        lg.channel_message_id = ch_mid
                        session.add(lg)
                        session.commit()

        rel = sp
        with Session(engine) as session:
            c = session.get(TelegramConfig, 1)
            sd = (c.save_directory or "") if c else ""
        try:
            if sd:
                rel = os.path.relpath(sp, sd)
        except ValueError:
            rel = sp

        await status_msg.edit_text(
            f"✅ 已保存: {html.escape(info['original_filename'])}\n"
            f"📦 大小: {format_file_size(real_size)}\n"
            f"📁 {html.escape(rel)}",
            parse_mode="HTML",
        )

        await ws_router.broadcast(
            {
                "type": "bot_download_done",
                "data": {
                    "filename": info["original_filename"],
                    "saved_path": sp,
                    "media_id": media_id_val,
                    "channel_message_id": ch_mid,
                },
            }
        )
    except Exception as e:
        logger.exception("telegram media: %s", e)
        err_msg = str(e)[:500]
        if log_id:
            with Session(engine) as session:
                lg = session.get(TelegramMediaLog, log_id)
                if lg:
                    lg.status = "failed"
                    lg.error_message = err_msg
                    session.add(lg)
                    session.commit()
        try:
            await status_msg.edit_text(f"❌ 失败: {err_msg[:200]}")
        except Exception:
            pass
        await ws_router.broadcast(
            {
                "type": "bot_download_failed",
                "data": {"filename": info["original_filename"], "error": err_msg},
            }
        )
