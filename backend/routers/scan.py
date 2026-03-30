import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, select

from database import engine, get_session
from models import WatchedFolder
from routers import ws as ws_router
from schemas import ScanBody
from services.scanner import scan_folder
import state

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scan", tags=["scan"])


async def _broadcast_scan_progress(current_file: str, count: int) -> None:
    await ws_router.broadcast(
        {"type": "scan_progress", "data": {"current_file": current_file, "count": count}}
    )


async def _run_scan(folder_id: Optional[int]) -> None:
    state.scanning = True
    state.scan_folder_id = folder_id
    try:
        with Session(engine) as session:
            if folder_id is not None:
                folder = session.get(WatchedFolder, folder_id)
                folders = [folder] if folder else []
            else:
                folders = session.exec(
                    select(WatchedFolder).where(WatchedFolder.is_active == True)  # noqa: E712
                ).all()
            total_new = total_upd = total_files = 0
            for folder in folders:
                if not folder:
                    continue
                p = folder.path
                from pathlib import Path as P

                if not P(p).is_dir():
                    continue
                try:
                    result = await scan_folder(folder, session, _broadcast_scan_progress)
                    total_new += result.get("new", 0)
                    total_upd += result.get("updated", 0)
                    total_files += result.get("total", 0)
                except Exception as e:
                    logger.exception("scan folder %s: %s", p, e)
            await ws_router.broadcast(
                {
                    "type": "scan_done",
                    "data": {"new": total_new, "updated": total_upd, "total": total_files},
                }
            )
    finally:
        state.scanning = False
        state.scan_folder_id = None


@router.post("")
async def trigger_scan(
    body: Optional[ScanBody] = Body(default=None),
    session: Session = Depends(get_session),
):
    if state.scanning:
        raise HTTPException(status_code=409, detail="Scan already in progress")
    folder_id = body.folder_id if body else None
    if folder_id is not None:
        f = session.get(WatchedFolder, folder_id)
        if not f:
            raise HTTPException(status_code=404, detail="Folder not found")

    async def job():
        await _run_scan(folder_id)

    asyncio.create_task(job())
    return {"ok": True, "folder_id": folder_id}


@router.get("/status")
def scan_status() -> dict:
    return {"scanning": state.scanning, "folder_id": state.scan_folder_id}
