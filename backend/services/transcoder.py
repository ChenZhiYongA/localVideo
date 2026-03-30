import asyncio
import logging
import re
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)

time_pattern = re.compile(r"time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})")


async def transcode_to_hls(
    media_id: str,
    input_path: str,
    duration_seconds: float,
    source_height: int,
    progress_callback: Optional[Callable[[str, str, float], Awaitable[None]]] = None,
) -> str:
    output_dir = settings.hls_dir / media_id
    output_dir.mkdir(parents=True, exist_ok=True)

    h_src = max(source_height or 360, 360)

    renditions: list[dict] = []
    if h_src >= 1080:
        renditions.append(
            {
                "height": 1080,
                "video_bitrate": "5000k",
                "audio_bitrate": "192k",
                "bandwidth": 5192000,
            }
        )
    if h_src >= 720:
        renditions.append(
            {
                "height": 720,
                "video_bitrate": "2500k",
                "audio_bitrate": "128k",
                "bandwidth": 2628000,
            }
        )
    renditions.append(
        {"height": 480, "video_bitrate": "1000k", "audio_bitrate": "96k", "bandwidth": 1096000}
    )
    renditions.append(
        {"height": 360, "video_bitrate": "500k", "audio_bitrate": "64k", "bandwidth": 564000}
    )

    n = len(renditions)
    dur = duration_seconds if duration_seconds and duration_seconds > 0 else 1.0

    for idx, rendition in enumerate(renditions):
        h = rendition["height"]
        rendition_dir = output_dir / f"{h}p"
        rendition_dir.mkdir(exist_ok=True)
        vb = rendition["video_bitrate"]
        vb_num = int(vb.replace("k", ""))
        bufsize = f"{vb_num * 2}k"

        cmd = [
            settings.ffmpeg_path,
            "-i",
            input_path,
            "-c:v",
            "libx264",
            "-preset",
            settings.ffmpeg_preset,
            "-crf",
            settings.ffmpeg_crf,
            "-b:v",
            vb,
            "-maxrate",
            vb,
            "-bufsize",
            bufsize,
            "-vf",
            f"scale=-2:{h}",
            "-c:a",
            "aac",
            "-b:a",
            rendition["audio_bitrate"],
            "-hls_time",
            str(settings.hls_segment_duration),
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            str(rendition_dir / "seg%03d.ts"),
            str(rendition_dir / "stream.m3u8"),
            "-y",
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )

        assert proc.stderr is not None
        while True:
            line = await proc.stderr.readline()
            if not line:
                break
            line_str = line.decode("utf-8", errors="ignore")
            match = time_pattern.search(line_str)
            if match and progress_callback and dur > 0:
                hv, mv, sv, csv = map(int, match.groups())
                current_seconds = hv * 3600 + mv * 60 + sv + csv / 100
                local_pct = min(99.0, (current_seconds / dur) * 100)
                overall = ((idx + local_pct / 100) / n) * 100
                overall = min(99.0, overall)
                try:
                    await progress_callback(media_id, f"{h}p", overall)
                except Exception as e:
                    logger.exception("progress cb: %s", e)

        await proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"FFmpeg failed {h}p for {media_id}")

    master_path = output_dir / "master.m3u8"
    with open(master_path, "w", encoding="utf-8") as f:
        f.write("#EXTM3U\n")
        f.write("#EXT-X-VERSION:3\n")
        for rendition in renditions:
            h = rendition["height"]
            rel_playlist = f"{h}p/stream.m3u8"
            if (output_dir / f"{h}p" / "stream.m3u8").exists():
                f.write(
                    f'#EXT-X-STREAM-INF:BANDWIDTH={rendition["bandwidth"]},RESOLUTION=-1x{h}\n'
                )
                f.write(f"{rel_playlist}\n")

    return str(master_path)
