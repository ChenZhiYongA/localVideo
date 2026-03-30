import logging
import math
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, col, func, select

from database import get_session
from models import MediaFile, MediaTag, TelegramMediaLog, WatchedFolder
from schemas import (
    FavoriteResponse,
    LibraryResponse,
    LibraryStats,
    MediaItem,
    MediaTagsResponse,
    MediaTagsUpdate,
    WatchProgressIn,
)
from services.recommendation import rank_recommendation_pool
from services.serialize_media import media_file_to_item

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["library"])


def _media_from_telegram(session: Session, media_id: str) -> bool:
    n = session.exec(
        select(func.count()).select_from(TelegramMediaLog).where(TelegramMediaLog.media_id == media_id)
    ).one()
    return int(n or 0) > 0


def _telegram_media_id_set(session: Session) -> set[str]:
    rows = session.exec(
        select(TelegramMediaLog.media_id).where(TelegramMediaLog.media_id.isnot(None))
    ).all()
    return {str(x) for x in rows if x}


def _normalize_tags(tags: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for raw in tags:
        t = " ".join((raw or "").strip().split())
        if not t:
            continue
        if len(t) > 24:
            t = t[:24]
        k = t.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(t)
        if len(out) >= 32:
            break
    return out


def _tags_map(session: Session, media_ids: list[str]) -> dict[str, list[str]]:
    if not media_ids:
        return {}
    rows = session.exec(select(MediaTag).where(MediaTag.media_id.in_(media_ids))).all()
    mp: dict[str, list[str]] = {}
    for r in rows:
        mp.setdefault(r.media_id, []).append(r.tag)
    return mp


def _apply_source_filter(source: str, stmt, count_stmt):
    if source not in ("telegram", "local"):
        return stmt, count_stmt
    tg_sub = select(TelegramMediaLog.media_id).where(TelegramMediaLog.media_id.isnot(None))
    if source == "telegram":
        stmt = stmt.where(MediaFile.id.in_(tg_sub))
        count_stmt = count_stmt.where(MediaFile.id.in_(tg_sub))
    else:
        stmt = stmt.where(~col(MediaFile.id).in_(tg_sub))
        count_stmt = count_stmt.where(~col(MediaFile.id).in_(tg_sub))
    return stmt, count_stmt


def _sort_column(sort: str):
    mapping = {
        "name": MediaFile.name_no_ext,
        "date": MediaFile.modified_at,
        "indexed": MediaFile.indexed_at,
        "size": MediaFile.file_size,
        "duration": MediaFile.duration_seconds,
        "play_count": MediaFile.play_count,
    }
    return mapping.get(sort, MediaFile.modified_at)


def _library_filtered_stmt(
    type: str,
    folder_id: Optional[int],
    source: str,
    search: Optional[str],
    favorites_only: bool,
):
    stmt = select(MediaFile)
    if type == "video":
        stmt = stmt.where(MediaFile.media_type == "video")
    elif type == "image":
        stmt = stmt.where(MediaFile.media_type == "image")
    elif type == "audio":
        stmt = stmt.where(MediaFile.media_type == "audio")

    if folder_id is not None:
        stmt = stmt.where(MediaFile.folder_id == folder_id)

    if favorites_only:
        stmt = stmt.where(MediaFile.is_favorite == True)  # noqa: E712

    count_stmt = select(func.count()).select_from(MediaFile)
    if type == "video":
        count_stmt = count_stmt.where(MediaFile.media_type == "video")
    elif type == "image":
        count_stmt = count_stmt.where(MediaFile.media_type == "image")
    elif type == "audio":
        count_stmt = count_stmt.where(MediaFile.media_type == "audio")
    if folder_id is not None:
        count_stmt = count_stmt.where(MediaFile.folder_id == folder_id)
    if favorites_only:
        count_stmt = count_stmt.where(MediaFile.is_favorite == True)  # noqa: E712
    stmt, count_stmt = _apply_source_filter(source, stmt, count_stmt)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        stmt = stmt.where(func.lower(MediaFile.name_no_ext).like(q))
        count_stmt = count_stmt.where(func.lower(MediaFile.name_no_ext).like(q))

    return stmt, count_stmt


@router.get("/library", response_model=LibraryResponse)
def get_library(
    session: Session = Depends(get_session),
    type: str = Query("all", alias="type"),
    folder_id: Optional[int] = None,
    sort: str = "date",
    order: str = "desc",
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(40, ge=1, le=100),
    favorites_only: bool = False,
    source: str = Query("all"),
) -> LibraryResponse:
    if source not in ("all", "telegram", "local"):
        source = "all"
    stmt, count_stmt = _library_filtered_stmt(type, folder_id, source, search, favorites_only)

    if sort == "recommend":
        pool = rank_recommendation_pool(session, stmt)
        total = len(pool)
        total_pages = max(1, math.ceil(total / per_page)) if total else 1
        offset = (page - 1) * per_page
        rows = pool[offset : offset + per_page]
        from state import transcode_progress

        tg_ids = _telegram_media_id_set(session)
        tag_mp = _tags_map(session, [r.id for r in rows])
        items = [
            media_file_to_item(
                r,
                transcode_progress.get(r.id),
                from_telegram=(r.id in tg_ids),
                tags=tag_mp.get(r.id, []),
            )
            for r in rows
        ]
        return LibraryResponse(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
        )

    col_sort = _sort_column(sort)
    if order == "asc":
        stmt = stmt.order_by(col_sort.asc())
    else:
        stmt = stmt.order_by(col_sort.desc())

    total = session.exec(count_stmt).one()
    total_pages = max(1, math.ceil(total / per_page)) if total else 1
    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page)
    rows = session.exec(stmt).all()

    from state import transcode_progress

    tg_ids = _telegram_media_id_set(session)
    tag_mp = _tags_map(session, [r.id for r in rows])
    items = [
        media_file_to_item(
            r,
            transcode_progress.get(r.id),
            from_telegram=(r.id in tg_ids),
            tags=tag_mp.get(r.id, []),
        )
        for r in rows
    ]
    return LibraryResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/media/{media_id}/file")
def get_media_file(media_id: str, session: Session = Depends(get_session)) -> FileResponse:
    m = session.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    if m.media_type not in ("image", "audio"):
        raise HTTPException(status_code=400, detail="Not a static file type")
    p = Path(m.file_path)
    if not p.is_file():
        raise HTTPException(status_code=404, detail="Missing file")
    mime, _ = mimetypes.guess_type(str(p))
    return FileResponse(str(p), media_type=mime or "application/octet-stream")


@router.get("/media/{media_id}", response_model=MediaItem)
def get_media(media_id: str, session: Session = Depends(get_session)) -> MediaItem:
    m = session.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    from state import transcode_progress

    return media_file_to_item(
        m,
        transcode_progress.get(m.id),
        from_telegram=_media_from_telegram(session, media_id),
        tags=_tags_map(session, [m.id]).get(m.id, []),
    )


@router.post("/media/{media_id}/play", response_model=MediaItem)
def record_play(media_id: str, session: Session = Depends(get_session)) -> MediaItem:
    m = session.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    m.play_count = (m.play_count or 0) + 1
    m.last_played = datetime.utcnow()
    session.add(m)
    session.commit()
    session.refresh(m)
    from state import transcode_progress

    return media_file_to_item(
        m,
        transcode_progress.get(m.id),
        from_telegram=_media_from_telegram(session, media_id),
        tags=_tags_map(session, [m.id]).get(m.id, []),
    )


@router.get("/media/{media_id}/tags", response_model=MediaTagsResponse)
def get_media_tags(media_id: str, session: Session = Depends(get_session)) -> MediaTagsResponse:
    m = session.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    rows = session.exec(select(MediaTag).where(MediaTag.media_id == media_id)).all()
    return MediaTagsResponse(media_id=media_id, tags=[r.tag for r in rows])


@router.put("/media/{media_id}/tags", response_model=MediaTagsResponse)
def put_media_tags(
    media_id: str, body: MediaTagsUpdate, session: Session = Depends(get_session)
) -> MediaTagsResponse:
    m = session.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    tags = _normalize_tags(body.tags)
    old = session.exec(select(MediaTag).where(MediaTag.media_id == media_id)).all()
    for r in old:
        session.delete(r)
    for t in tags:
        session.add(MediaTag(media_id=media_id, tag=t))
    session.commit()
    return MediaTagsResponse(media_id=media_id, tags=tags)


@router.post("/media/{media_id}/watch-progress")
def watch_progress(media_id: str, body: WatchProgressIn, session: Session = Depends(get_session)) -> dict:
    m = session.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    delta = max(0.0, min(float(body.delta_seconds), 72.0))
    wt = int(getattr(m, "watch_time_seconds", 0) or 0)
    m.watch_time_seconds = wt + int(delta)
    if body.position_seconds is not None:
        m.last_position_seconds = body.position_seconds
    m.last_watch_at = datetime.utcnow()
    session.add(m)
    session.commit()
    return {"ok": True}


@router.patch("/media/{media_id}/favorite", response_model=FavoriteResponse)
def toggle_favorite(media_id: str, session: Session = Depends(get_session)) -> FavoriteResponse:
    m = session.get(MediaFile, media_id)
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    m.is_favorite = not m.is_favorite
    session.add(m)
    session.commit()
    return FavoriteResponse(is_favorite=m.is_favorite)


@router.get("/library/stats", response_model=LibraryStats)
def library_stats(session: Session = Depends(get_session)) -> LibraryStats:
    videos = session.exec(
        select(func.count()).select_from(MediaFile).where(MediaFile.media_type == "video")
    ).one()
    images = session.exec(
        select(func.count()).select_from(MediaFile).where(MediaFile.media_type == "image")
    ).one()
    audio = session.exec(
        select(func.count()).select_from(MediaFile).where(MediaFile.media_type == "audio")
    ).one()
    size_sum = session.exec(
        select(func.coalesce(func.sum(MediaFile.file_size), 0)).select_from(MediaFile)
    ).one()
    dur_sum = session.exec(
        select(func.coalesce(func.sum(MediaFile.duration_seconds), 0))
        .select_from(MediaFile)
        .where(MediaFile.media_type == "video")
    ).one()
    folders = session.exec(select(func.count()).select_from(WatchedFolder)).one()
    pending = session.exec(
        select(func.count())
        .select_from(MediaFile)
        .where(MediaFile.media_type == "video")
        .where(col(MediaFile.transcode_status).in_(["pending", "processing"]))
    ).one()
    return LibraryStats(
        total_videos=int(videos or 0),
        total_images=int(images or 0),
        total_audio=int(audio or 0),
        total_size_bytes=int(size_sum or 0),
        total_duration_seconds=float(dur_sum or 0),
        folders_count=int(folders or 0),
        pending_transcode=int(pending or 0),
    )
