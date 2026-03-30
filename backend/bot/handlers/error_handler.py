import logging
import traceback

from telegram import Update
from telegram.ext import ContextTypes

logger = logging.getLogger(__name__)


async def handle_error(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    err = context.error
    tb = "".join(traceback.format_exception(type(err), err, err.__traceback__))
    logger.error("telegram handler error: %s\n%s", err, tb)
    if isinstance(update, Update) and update.effective_message:
        try:
            await update.effective_message.reply_text("❌ 处理出错，请稍后重试。")
        except Exception:
            pass
