import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlmodel import Session, col, func, select
from database import engine, get_session
from models import TelegramConfig, TelegramMediaLog
from schemas import (
    TelegramAggregateStats,
    TelegramConfigResponse,
    TelegramConfigUpdate,
    TelegramLogsResponse,
    TelegramMediaLogItem,
    TestChannelResponse,
    TestConnectionResponse,
)
from utils.file_utils import format_file_size

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/telegram", tags=["telegram"])


def _mask_token(token: str) -> str:
    if not token:
        return ""
    if len(token) <= 4:
        return "••••"
    return "•" * 12 + token[-4:]


def _channel_url(channel_id: str, message_id: Optional[int]) -> Optional[str]:
    if not message_id:
        return None
    if channel_id.startswith("@"):
        return f"https://t.me/{channel_id[1:]}/{message_id}"
    if channel_id.startswith("-100"):
        return f"https://t.me/c/{channel_id[4:]}/{message_id}"
    return None


def _ensure_config_row(session: Session) -> TelegramConfig:
    row = session.get(TelegramConfig, 1)
    if not row:
        row = TelegramConfig(id=1)
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


def _config_response(session: Session, cfg: TelegramConfig) -> TelegramConfigResponse:
    from bot import runner as bot_runner

    try:
        st = bot_runner.get_bot_status()
        un = bot_runner.get_bot_username()
    except Exception:
        st = "offline"
        un = None
    if st == "online":
        status = "online"
    elif cfg.is_enabled and (cfg.bot_token or "").strip():
        status = "error"
    else:
        status = "offline"
    return TelegramConfigResponse(
        id=cfg.id,
        bot_token_masked=_mask_token(cfg.bot_token or ""),
        channel_id=cfg.channel_id or "",
        save_directory=cfg.save_directory or "",
        is_enabled=cfg.is_enabled,
        caption_template=cfg.caption_template,
        auto_scan=cfg.auto_scan,
        auto_transcode=cfg.auto_transcode,
        forward_to_channel=cfg.forward_to_channel,
        allowed_user_ids=cfg.allowed_user_ids or "",
        local_api_url=cfg.local_api_url,
        updated_at=cfg.updated_at,
        bot_status=status,
        bot_username=f"@{un}" if un else None,
    )


@router.get("/config", response_model=TelegramConfigResponse)
def get_config(session: Session = Depends(get_session)) -> TelegramConfigResponse:
    cfg = _ensure_config_row(session)
    return _config_response(session, cfg)


@router.put("/config", response_model=TelegramConfigResponse)
async def put_config(body: TelegramConfigUpdate, session: Session = Depends(get_session)) -> TelegramConfigResponse:
    cfg = _ensure_config_row(session)
    data = body.model_dump(exclude_unset=True)
    if "bot_token" in data and data["bot_token"] is not None:
        if (data["bot_token"] or "").strip() == "":
            data.pop("bot_token", None)
        else:
            cfg.bot_token = data["bot_token"].strip()
    for k in (
        "channel_id",
        "save_directory",
        "is_enabled",
        "caption_template",
        "auto_scan",
        "auto_transcode",
        "forward_to_channel",
        "allowed_user_ids",
        "local_api_url",
    ):
        if k in data and data[k] is not None:
            setattr(cfg, k, data[k])
    cfg.updated_at = datetime.utcnow()
    session.add(cfg)
    session.commit()
    session.refresh(cfg)

    try:
        from bot import runner as bot_runner

        await bot_runner.restart_bot()
    except Exception as e:
        logger.exception("telegram restart: %s", e)

    return _config_response(session, cfg)


@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection(
    body: dict = Body(default_factory=dict), session: Session = Depends(get_session)
) -> TestConnectionResponse:
    token = (body.get("bot_token") or "").strip()
    if not token:
        cfg = _ensure_config_row(session)
        token = (cfg.bot_token or "").strip()
    if not token:
        return TestConnectionResponse(valid=False, error="empty token")
    try:
        from telegram import Bot as TgBot

        b = TgBot(token)
        me = await b.get_me()
        return TestConnectionResponse(
            valid=True,
            bot_username=me.username,
            bot_first_name=me.first_name,
            error=None,
        )
    except Exception as e:
        logger.warning("telegram test connection: %s", e)
        return TestConnectionResponse(valid=False, error=str(e)[:200])


@router.post("/test-channel", response_model=TestChannelResponse)
async def test_channel(body: dict, session: Session = Depends(get_session)) -> TestChannelResponse:
    cfg = _ensure_config_row(session)
    token = (body.get("bot_token") or cfg.bot_token or "").strip()
    ch = (body.get("channel_id") or cfg.channel_id or "").strip()
    if not token or not ch:
        return TestChannelResponse(success=False, error="需要 token 与频道 ID")
    try:
        from telegram import Bot as TgBot

        b = TgBot(token)
        m = await b.send_message(chat_id=ch, text="🔧 LocalTube 连接测试")
        try:
            await b.delete_message(chat_id=ch, message_id=m.message_id)
        except Exception:
            pass
        return TestChannelResponse(success=True, error=None)
    except Exception as e:
        return TestChannelResponse(success=False, error=str(e)[:200])


@router.get("/logs", response_model=TelegramLogsResponse)
def get_logs(
    session: Session = Depends(get_session),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    media_type: Optional[str] = None,
) -> TelegramLogsResponse:
    cfg = _ensure_config_row(session)
    cnt_stmt = select(func.count()).select_from(TelegramMediaLog)
    if status:
        cnt_stmt = cnt_stmt.where(TelegramMediaLog.status == status)
    if media_type:
        cnt_stmt = cnt_stmt.where(TelegramMediaLog.media_type == media_type)
    total = session.exec(cnt_stmt).one()
    stmt = select(TelegramMediaLog)
    if status:
        stmt = stmt.where(TelegramMediaLog.status == status)
    if media_type:
        stmt = stmt.where(TelegramMediaLog.media_type == media_type)
    stmt = stmt.order_by(TelegramMediaLog.received_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = session.exec(stmt).all()
    items = []
    for r in rows:
        items.append(
            TelegramMediaLogItem(
                id=r.id,
                received_at=r.received_at,
                sender_id=r.sender_id,
                sender_name=r.sender_name,
                original_filename=r.original_filename,
                saved_path=r.saved_path,
                file_size=r.file_size,
                file_size_formatted=format_file_size(r.file_size),
                media_type=r.media_type,
                channel_message_id=r.channel_message_id,
                channel_url=_channel_url(cfg.channel_id, r.channel_message_id),
                media_id=r.media_id,
                status=r.status,
                error_message=r.error_message,
            )
        )
    return TelegramLogsResponse(items=items, total=int(total or 0), page=page, per_page=per_page)


@router.delete("/logs")
def clear_logs(session: Session = Depends(get_session)) -> dict:
    rows = session.exec(select(TelegramMediaLog)).all()
    n = len(rows)
    for r in rows:
        session.delete(r)
    session.commit()
    return {"deleted": n}


@router.get("/stats", response_model=TelegramAggregateStats)
def telegram_stats(session: Session = Depends(get_session)) -> TelegramAggregateStats:
    rows = session.exec(select(TelegramMediaLog)).all()
    total = len(rows)
    ok = sum(1 for r in rows if r.status == "done")
    rate = (ok / total) if total else 1.0
    sz = sum(r.file_size for r in rows)
    by_type: dict[str, int] = {}
    for r in rows:
        by_type[r.media_type] = by_type.get(r.media_type, 0) + 1
    last = None
    for r in rows:
        if last is None or r.received_at > last:
            last = r.received_at
    return TelegramAggregateStats(
        total_received=total,
        total_size_bytes=sz,
        by_type=by_type,
        last_received_at=last.isoformat() if last else None,
        success_rate=rate,
    )


def seed_from_env() -> None:
    with Session(engine) as session:
        cfg = _ensure_config_row(session)
        if (cfg.bot_token or "").strip():
            return
        t = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
        if not t:
            return
        cfg.bot_token = t
        cfg.channel_id = os.environ.get("TELEGRAM_CHANNEL_ID", "").strip()
        cfg.save_directory = os.environ.get("TELEGRAM_SAVE_DIRECTORY", "").strip()
        la = os.environ.get("TELEGRAM_LOCAL_API_URL", "").strip()
        if la:
            cfg.local_api_url = la
        session.add(cfg)
        session.commit()
