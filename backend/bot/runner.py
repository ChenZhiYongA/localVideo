import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_bot_task: Optional[asyncio.Task] = None
_bot_application = None


def get_bot_status() -> str:
    import bot_state

    if bot_state.bot_online and _bot_task and not _bot_task.done():
        return "online"
    return "offline"


def get_bot_username() -> Optional[str]:
    import bot_state

    return bot_state.bot_username


async def _bot_worker(token: str, base_url: Optional[str]) -> None:
    global _bot_application
    import bot_state as bs
    from bot.application import build_bot_application
    from routers import ws as ws_router

    app = build_bot_application(token, base_url)
    _bot_application = app
    try:
        await app.initialize()
        await app.start()
        me = await app.bot.get_me()
        bs.bot_username = me.username if me else None
        bs.bot_online = True
        await ws_router.broadcast(
            {
                "type": "bot_online",
                "data": {"bot_username": f"@{bs.bot_username}" if bs.bot_username else ""},
            }
        )
        await app.updater.start_polling(allowed_updates=["message"], drop_pending_updates=True)
    except asyncio.CancelledError:
        raise
    except Exception as e:
        logger.exception("Telegram bot worker: %s", e)
        bs.bot_online = False
        raise
    finally:
        bs.bot_online = False
        try:
            await app.updater.stop()
        except Exception:
            pass
        try:
            await app.stop()
        except Exception:
            pass
        try:
            await app.shutdown()
        except Exception:
            pass
        bs.bot_username = None


async def start_bot_from_config() -> None:
    global _bot_task
    from bot import TELEGRAM_AVAILABLE

    if not TELEGRAM_AVAILABLE:
        logger.warning("Telegram bot disabled: python-telegram-bot not installed")
        return

    from sqlmodel import Session

    from database import engine
    from models import TelegramConfig

    with Session(engine) as session:
        cfg = session.get(TelegramConfig, 1)
        if not cfg or not cfg.is_enabled or not (cfg.bot_token or "").strip():
            return
        token = cfg.bot_token.strip()
        base = (cfg.local_api_url or "").strip() or None

    if _bot_task and not _bot_task.done():
        await stop_bot()

    _bot_task = asyncio.create_task(_bot_worker(token, base))
    logger.info("Telegram bot task created")


async def stop_bot() -> None:
    global _bot_task, _bot_application
    from routers import ws as ws_router

    if _bot_task and not _bot_task.done():
        _bot_task.cancel()
        try:
            await _bot_task
        except asyncio.CancelledError:
            pass
    _bot_task = None
    _bot_application = None
    import bot_state as bs

    bs.bot_online = False
    bs.bot_username = None
    await ws_router.broadcast({"type": "bot_offline", "data": {}})


async def restart_bot() -> None:
    await stop_bot()
    await start_bot_from_config()
