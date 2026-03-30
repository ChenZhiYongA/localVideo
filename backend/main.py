import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_db_and_tables
from queue_worker import start_workers
from routers import app_settings, comments, folders, library, scan, stream, telegram, thumbnails, ws

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_worker_tasks: list = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    telegram.seed_from_env()
    global _worker_tasks
    _worker_tasks = start_workers()
    try:
        from bot import runner as bot_runner

        await bot_runner.start_bot_from_config()
    except Exception as e:
        logger.exception("telegram bot startup: %s", e)
    yield
    try:
        from bot import runner as bot_runner

        await bot_runner.stop_bot()
    except Exception as e:
        logger.exception("telegram bot shutdown: %s", e)
    for t in _worker_tasks:
        t.cancel()
    for t in _worker_tasks:
        try:
            await t
        except asyncio.CancelledError:
            pass
        except Exception:
            pass


app = FastAPI(title="LocalTube API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(library.router)
app.include_router(folders.router)
app.include_router(scan.router)
app.include_router(stream.router)
app.include_router(thumbnails.router)
app.include_router(app_settings.router)
app.include_router(telegram.router)
app.include_router(comments.router)
app.include_router(ws.router)
