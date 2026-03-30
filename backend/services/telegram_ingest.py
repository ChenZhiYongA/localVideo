import logging
import os
from pathlib import Path

from sqlmodel import Session, select

from models import MediaFile, WatchedFolder
from services.scanner import scan_folder

logger = logging.getLogger(__name__)


def ensure_watched_folder(session: Session, save_path: str) -> WatchedFolder:
    norm = os.path.normpath(save_path)
    Path(norm).mkdir(parents=True, exist_ok=True)
    row = session.exec(select(WatchedFolder).where(WatchedFolder.path == norm)).first()
    if row:
        return row
    name = Path(norm).name or "telegram"
    row = WatchedFolder(path=norm, name=name)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


async def scan_path_and_get_media_id(session: Session, folder: WatchedFolder, saved_path: str) -> str | None:
    norm = os.path.normpath(saved_path)
    try:
        await scan_folder(folder, session, None)
    except Exception as e:
        logger.exception("telegram scan_folder: %s", e)
        return None
    mf = session.exec(select(MediaFile).where(MediaFile.file_path == norm)).first()
    return mf.id if mf else None
