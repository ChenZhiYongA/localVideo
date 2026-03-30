import asyncio
import logging
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from config import settings

logger = logging.getLogger(__name__)


class DebouncedHandler(FileSystemEventHandler):
    def __init__(self, loop: asyncio.AbstractEventLoop, on_change) -> None:
        self._loop = loop
        self._on_change = on_change
        self._task = None

    def _schedule(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = self._loop.create_task(self._debounced())

    async def _debounced(self) -> None:
        await asyncio.sleep(2.0)
        try:
            await self._on_change()
        except Exception as e:
            logger.exception("watcher on_change: %s", e)

    def on_any_event(self, event) -> None:
        if event.is_directory:
            return
        p = Path(event.src_path)
        ext = p.suffix.lower().lstrip(".")
        if ext not in settings.video_extensions and ext not in settings.image_extensions:
            return
        self._loop.call_soon_threadsafe(self._schedule)


_observers: list[Observer] = []


def start_watcher(loop: asyncio.AbstractEventLoop, on_change) -> None:
    global _observers
    from database import engine
    from sqlmodel import Session, select

    from models import WatchedFolder

    with Session(engine) as session:
        folders = session.exec(select(WatchedFolder).where(WatchedFolder.is_active == True)).all()  # noqa: E712

    for folder in folders:
        path = Path(folder.path)
        if not path.is_dir():
            continue
        obs = Observer()
        obs.schedule(DebouncedHandler(loop, on_change), str(path), recursive=True)
        obs.start()
        _observers.append(obs)
        logger.info("watchdog started: %s", path)


def stop_watcher() -> None:
    for obs in _observers:
        try:
            obs.stop()
            obs.join(timeout=2)
        except Exception as e:
            logger.warning("observer stop: %s", e)
    _observers.clear()
