import logging
from collections import defaultdict
from typing import Any

logger = logging.getLogger(__name__)


def build_caption(template: str, metadata: dict[str, Any]) -> str:
    safe_meta: defaultdict[str, str] = defaultdict(str, **{k: str(v) if v is not None else "" for k, v in metadata.items()})
    try:
        return template.format_map(safe_meta)
    except Exception as e:
        logger.warning("caption template error: %s", e)
        return f"📁 {metadata.get('filename', 'Unknown')}\n📦 {metadata.get('size', '')}"
