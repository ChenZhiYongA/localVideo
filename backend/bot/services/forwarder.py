import logging
from typing import Optional

from telegram import Bot, Update

from bot.services.caption_builder import build_caption

logger = logging.getLogger(__name__)


async def forward_to_channel(
    bot: Bot,
    update: Update,
    config,
    saved_path: str,
    media_metadata: dict,
) -> Optional[int]:
    caption = build_caption(config.caption_template, media_metadata)
    msg = update.effective_message
    if not msg:
        return None
    try:
        sent = await bot.copy_message(
            chat_id=config.channel_id,
            from_chat_id=msg.chat_id,
            message_id=msg.message_id,
            caption=caption,
            parse_mode="HTML",
        )
        return sent.message_id
    except Exception as e:
        logger.warning("copy_message failed: %s", e)
        try:
            sent = await bot.forward_message(
                chat_id=config.channel_id,
                from_chat_id=msg.chat_id,
                message_id=msg.message_id,
            )
            return sent.message_id
        except Exception as e2:
            logger.warning("forward_message failed: %s", e2)
            return None
