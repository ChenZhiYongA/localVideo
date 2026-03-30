from collections.abc import Generator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

from config import settings

engine = create_engine(
    f"sqlite:///{settings.db_path}",
    connect_args={"check_same_thread": False},
    echo=False,
)


def _migrate_sqlite() -> None:
    if "sqlite" not in str(engine.url):
        return
    insp = inspect(engine)
    with engine.begin() as conn:
        if insp.has_table("watchedfolder"):
            cols = {c["name"] for c in insp.get_columns("watchedfolder")}
            if "audio_count" not in cols:
                conn.execute(
                    text("ALTER TABLE watchedfolder ADD COLUMN audio_count INTEGER NOT NULL DEFAULT 0")
                )
        if insp.has_table("mediafile"):
            mcols = {c["name"] for c in insp.get_columns("mediafile")}
            if "watch_time_seconds" not in mcols:
                conn.execute(
                    text(
                        "ALTER TABLE mediafile ADD COLUMN watch_time_seconds INTEGER NOT NULL DEFAULT 0"
                    )
                )
            if "last_position_seconds" not in mcols:
                conn.execute(text("ALTER TABLE mediafile ADD COLUMN last_position_seconds REAL"))
            if "last_watch_at" not in mcols:
                conn.execute(text("ALTER TABLE mediafile ADD COLUMN last_watch_at TIMESTAMP"))


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _migrate_sqlite()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
