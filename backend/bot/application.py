import logging

from telegram.ext import Application, CommandHandler, MessageHandler, filters

from bot.handlers.command_handler import handle_help, handle_start, handle_stats, handle_status
from bot.handlers.error_handler import handle_error
from bot.handlers.media_handler import handle_media

logger = logging.getLogger(__name__)


def build_bot_application(token: str, base_url: str | None = None) -> Application:
    b = Application.builder().token(token)
    if base_url:
        b = b.base_url(base_url.rstrip("/") + "/")
    app = b.build()
    app.add_handler(MessageHandler(filters.VIDEO, handle_media))
    app.add_handler(MessageHandler(filters.PHOTO, handle_media))
    app.add_handler(MessageHandler(filters.AUDIO, handle_media))
    app.add_handler(MessageHandler(filters.VOICE, handle_media))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_media))
    app.add_handler(CommandHandler("start", handle_start))
    app.add_handler(CommandHandler("help", handle_help))
    app.add_handler(CommandHandler("status", handle_status))
    app.add_handler(CommandHandler("stats", handle_stats))
    app.add_error_handler(handle_error)
    return app
