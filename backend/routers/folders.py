import logging
import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from config import settings
from database import get_session
from models import MediaFile, WatchedFolder
from schemas import FolderCreate, WatchedFolderOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/folders", tags=["folders"])


def _folder_out(f: WatchedFolder) -> WatchedFolderOut:
    return WatchedFolderOut(
        id=f.id,
        path=f.path,
        name=f.name,
        added_at=f.added_at.isoformat() if f.added_at else "",
        last_scanned=f.last_scanned.isoformat() if f.last_scanned else None,
        total_files=f.total_files,
        video_count=f.video_count,
        image_count=f.image_count,
        audio_count=getattr(f, "audio_count", 0) or 0,
        is_active=f.is_active,
    )


@router.get("", response_model=list[WatchedFolderOut])
def list_folders(session: Session = Depends(get_session)) -> list[WatchedFolderOut]:
    rows = session.exec(select(WatchedFolder).order_by(WatchedFolder.added_at)).all()
    return [_folder_out(r) for r in rows]


@router.post("", response_model=WatchedFolderOut, status_code=201)
def add_folder(body: FolderCreate, session: Session = Depends(get_session)) -> WatchedFolderOut:
    raw = body.path.strip().strip('"')
    path = Path(os.path.expanduser(raw)).resolve()
    if not path.is_dir():
        raise HTTPException(status_code=422, detail="Path is not an existing directory")
    path_str = os.path.normpath(str(path))
    existing = session.exec(select(WatchedFolder).where(WatchedFolder.path == path_str)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Folder already added")
    name = path.name or path_str
    row = WatchedFolder(path=path_str, name=name)
    session.add(row)
    session.commit()
    session.refresh(row)
    return _folder_out(row)


@router.delete("/{folder_id}", status_code=204)
def remove_folder(folder_id: int, session: Session = Depends(get_session)) -> None:
    row = session.get(WatchedFolder, folder_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    medias = session.exec(select(MediaFile).where(MediaFile.folder_id == folder_id)).all()
    for m in medias:
        try:
            if m.thumbnail_path and Path(m.thumbnail_path).is_file():
                Path(m.thumbnail_path).unlink(missing_ok=True)
            tjpg = settings.thumbnails_dir / f"{m.id}.jpg"
            tjpg.unlink(missing_ok=True)
            hls = settings.hls_dir / m.id
            if hls.is_dir():
                shutil.rmtree(hls, ignore_errors=True)
        except Exception as e:
            logger.warning("cleanup media %s: %s", m.id, e)
        session.delete(m)
    session.delete(row)
    session.commit()


@router.patch("/{folder_id}/toggle", response_model=WatchedFolderOut)
def toggle_active(folder_id: int, session: Session = Depends(get_session)) -> WatchedFolderOut:
    row = session.get(WatchedFolder, folder_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    row.is_active = not row.is_active
    session.add(row)
    session.commit()
    session.refresh(row)
    return _folder_out(row)
