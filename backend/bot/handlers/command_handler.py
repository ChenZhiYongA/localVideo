import logging
from pathlib import Path

from sqlmodel import Session, func, select
from telegram import Update
from telegram.ext import ContextTypes

from database import engine
from models import MediaFile, TelegramConfig, TelegramMediaLog
from utils.file_utils import format_file_size

logger = logging.getLogger(__name__)


def _allowed(user_id: int, config: TelegramConfig) -> bool:
    raw = (config.allowed_user_ids or "").strip()
    if not raw:
        return True
    ids = {int(x.strip()) for x in raw.split(",") if x.strip().isdigit()}
    return user_id in ids


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    with Session(engine) as session:
        cfg = session.get(TelegramConfig, 1)
        if cfg and not _allowed(update.effective_user.id, cfg):
            await update.message.reply_text("⛔ 未授权使用此机器人。")
            return
    await update.message.reply_text(
        "👋 LocalTube Bot\n\n"
        "发送或转发任意媒体，将保存到 LocalTube 媒体库。\n\n"
        "命令：/status /stats /help"
    )


async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await handle_start(update, context)


async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    uid = update.effective_user.id
    with Session(engine) as session:
        cfg = session.get(TelegramConfig, 1)
        if not cfg:
            await update.message.reply_text("未配置。")
            return
        if not _allowed(uid, cfg):
            await update.message.reply_text("⛔ 未授权。")
            return
        save = cfg.save_directory or ""
        ok_dir = bool(save and Path(save).is_dir())
        writable = False
        if ok_dir:
            try:
                p = Path(save) / ".localtube_write_test"
                p.write_text("ok")
                p.unlink(missing_ok=True)
                writable = True
            except OSError:
                writable = False
        warn = ""
        if not ok_dir or not writable:
            warn = "\n⚠️ 保存目录不可用或不可写。"
        import bot_state

        st = "online" if bot_state.bot_online else "offline"
        await update.message.reply_text(
            f"🟢 状态: {st}\n"
            f"📁 保存目录: {save or '未设置'}{warn}\n"
            f"📡 转发频道: {cfg.channel_id or '未配置'}\n"
            f"🔄 自动扫描: {'开' if cfg.auto_scan else '关'}\n"
            f"🎬 自动转码: {'开' if cfg.auto_transcode else '关'}"
        )


async def handle_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    uid = update.effective_user.id
    with Session(engine) as session:
        cfg = session.get(TelegramConfig, 1)
        if not cfg or not _allowed(uid, cfg):
            await update.message.reply_text("⛔ 未授权。")
            return
        v = session.exec(
            select(func.count()).select_from(MediaFile).where(MediaFile.media_type == "video")
        ).one()
        i = session.exec(
            select(func.count()).select_from(MediaFile).where(MediaFile.media_type == "image")
        ).one()
        a = session.exec(
            select(func.count()).select_from(MediaFile).where(MediaFile.media_type == "audio")
        ).one()
        sz = session.exec(
            select(func.coalesce(func.sum(MediaFile.file_size), 0)).select_from(MediaFile)
        ).one()
        tc = session.exec(select(func.count()).select_from(TelegramMediaLog)).one()
        await update.message.reply_text(
            f"📊 媒体库\n"
            f"🎬 视频: {int(v or 0)}\n"
            f"🖼 图片: {int(i or 0)}\n"
            f"🎵 音频: {int(a or 0)}\n"
            f"📁 总大小: {format_file_size(int(sz or 0))}\n"
            f"📥 Bot 接收记录: {int(tc or 0)} 条"
        )
