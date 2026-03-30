from __future__ import annotations

import hashlib
import math
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

from sqlmodel import Session, col, func, select

from models import MediaFile, TelegramMediaLog


@dataclass
class TasteContext:
    cold: bool
    folder_weight: dict[int, float]
    type_weight: dict[str, float]
    tg_play_ratio: float
    total_plays: int
    total_watch_seconds: int


def _norm_map(raw: dict, default: float = 0.02) -> dict:
    s = sum(raw.values()) or 1.0
    return {k: max(default, v / s) for k, v in raw.items()}


def _merge_taste(play_map: dict, watch_map: dict, w_watch: float) -> dict:
    keys = set(play_map) | set(watch_map)
    out = {}
    for k in keys:
        out[k] = (1.0 - w_watch) * play_map.get(k, 0.0) + w_watch * watch_map.get(k, 0.0)
    return _norm_map(out)


def _age_days_last_played(lp: Optional[datetime]) -> float:
    if not lp:
        return 999.0
    now = datetime.utcnow()
    t = lp.replace(tzinfo=None) if lp.tzinfo else lp
    return max(0.0, (now - t).total_seconds() / 86400.0)


def _age_days_indexed(ix: Optional[datetime]) -> float:
    if not ix:
        return 400.0
    now = datetime.utcnow()
    t = ix.replace(tzinfo=None) if ix.tzinfo else ix
    return max(0.0, (now - t).total_seconds() / 86400.0)


def build_taste_context(session: Session) -> TasteContext:
    total_plays = int(session.exec(select(func.coalesce(func.sum(MediaFile.play_count), 0))).one() or 0)
    total_watch = int(session.exec(select(func.coalesce(func.sum(MediaFile.watch_time_seconds), 0))).one() or 0)
    cold = total_plays < 5 and total_watch < 240

    folder_rows = session.exec(
        select(MediaFile.folder_id, func.coalesce(func.sum(MediaFile.play_count), 0))
        .where(MediaFile.play_count > 0)
        .group_by(MediaFile.folder_id)
    ).all()
    folder_watch = session.exec(
        select(MediaFile.folder_id, func.coalesce(func.sum(MediaFile.watch_time_seconds), 0))
        .where(MediaFile.watch_time_seconds > 0)
        .group_by(MediaFile.folder_id)
    ).all()
    type_rows = session.exec(
        select(MediaFile.media_type, func.coalesce(func.sum(MediaFile.play_count), 0))
        .where(MediaFile.play_count > 0)
        .group_by(MediaFile.media_type)
    ).all()
    type_watch = session.exec(
        select(MediaFile.media_type, func.coalesce(func.sum(MediaFile.watch_time_seconds), 0))
        .where(MediaFile.watch_time_seconds > 0)
        .group_by(MediaFile.media_type)
    ).all()

    tg_sub = select(TelegramMediaLog.media_id).where(TelegramMediaLog.media_id.isnot(None))
    tg_play = session.exec(
        select(func.coalesce(func.sum(MediaFile.play_count), 0))
        .select_from(MediaFile)
        .where(MediaFile.id.in_(tg_sub))
    ).one()
    tg_watch = session.exec(
        select(func.coalesce(func.sum(MediaFile.watch_time_seconds), 0))
        .select_from(MediaFile)
        .where(MediaFile.id.in_(tg_sub))
    ).one()
    tg_play_ratio = float(tg_play or 0) / total_plays if total_plays > 0 else 0.45
    if total_watch > 0:
        tg_watch_ratio = float(tg_watch or 0) / total_watch
        tg_play_ratio = 0.5 * tg_play_ratio + 0.5 * tg_watch_ratio

    fw_p: dict[int, float] = {int(fid): float(s or 0) for fid, s in folder_rows}
    fw_w: dict[int, float] = {int(fid): float(s or 0) for fid, s in folder_watch}
    fw_p = _norm_map(fw_p, 0.015) if fw_p else {}
    fw_w = _norm_map(fw_w, 0.015) if fw_w else {}

    tw_p: dict[str, float] = {str(mt): float(s or 0) for mt, s in type_rows}
    tw_w: dict[str, float] = {str(mt): float(s or 0) for mt, s in type_watch}
    tw_p = _norm_map(tw_p, 0.12) if tw_p else {}
    tw_w = _norm_map(tw_w, 0.12) if tw_w else {}

    w_watch = 0.48 if total_watch > 120 else 0.28
    if not fw_w:
        w_watch = min(w_watch, 0.2)
    if not tw_w:
        w_watch = min(w_watch, 0.2)

    if fw_p and fw_w:
        folder_weight = _merge_taste(fw_p, fw_w, w_watch)
    elif fw_p:
        folder_weight = fw_p
    elif fw_w:
        folder_weight = fw_w
    else:
        folder_weight = {}

    if tw_p and tw_w:
        type_weight = _merge_taste(tw_p, tw_w, w_watch)
    elif tw_p:
        type_weight = tw_p
    elif tw_w:
        type_weight = tw_w
    else:
        type_weight = {"video": 0.34, "image": 0.33, "audio": 0.33}

    return TasteContext(
        cold=cold,
        folder_weight=folder_weight,
        type_weight=type_weight,
        tg_play_ratio=max(0.0, min(1.0, tg_play_ratio)),
        total_plays=total_plays,
        total_watch_seconds=total_watch,
    )


def _telegram_media_id_set(session: Session) -> set[str]:
    rows = session.exec(select(TelegramMediaLog.media_id).where(TelegramMediaLog.media_id.isnot(None))).all()
    return {str(x) for x in rows if x}


def _completion_ratio(m: MediaFile) -> Optional[float]:
    dur = m.duration_seconds
    pos = m.last_position_seconds
    if not dur or dur <= 0 or pos is None:
        return None
    return max(0.0, min(1.0, float(pos) / float(dur)))


def personalized_score(m: MediaFile, ctx: TasteContext, tg_ids: set[str]) -> float:
    play = float(m.play_count or 0)
    engagement = 46.0 * math.log1p(play)

    wt = int(getattr(m, "watch_time_seconds", 0) or 0)
    watch_eng = 44.0 * math.log1p(wt / 45.0)

    ages_lp = _age_days_last_played(m.last_played)
    recency = 28.0 * math.exp(-ages_lp / 17.0)

    lwa = getattr(m, "last_watch_at", None)
    if lwa:
        ages_lw = _age_days_last_played(lwa)
        watch_rec = 18.0 * math.exp(-ages_lw / 12.0)
    else:
        watch_rec = 0.0

    fresh_d = _age_days_indexed(m.indexed_at)
    freshness = 22.0 * math.exp(-fresh_d / 38.0)

    fav = 15.0 if m.is_favorite else 0.0

    if ctx.cold:
        taste_f = 6.5
        taste_t = 6.5
    else:
        fw = ctx.folder_weight.get(m.folder_id, 0.02)
        taste_f = 30.0 * math.sqrt(fw)
        tw = ctx.type_weight.get(m.media_type, 0.17)
        taste_t = 22.0 * math.sqrt(tw)

    is_tg = m.id in tg_ids
    tr = ctx.tg_play_ratio
    if tr >= 0.36:
        src_align = 13.0 * tr if is_tg else 5.0 * (1.0 - tr)
    elif tr <= 0.2:
        src_align = 13.0 * (1.0 - tr) if not is_tg else 5.0 * tr
    else:
        src_align = 7.5

    cr = _completion_ratio(m)
    complete_pen = 0.0
    if cr is not None and cr >= 0.88:
        complete_pen = -11.0 * (cr**2.2)

    day = str(date.today())
    salt = int(hashlib.md5(f"{m.id}{day}".encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
    explore = 4.8 * salt

    return (
        engagement
        + watch_eng
        + recency
        + watch_rec
        + freshness
        + fav
        + taste_f
        + taste_t
        + src_align
        + complete_pen
        + explore
    )


def _sim(a: MediaFile, b: MediaFile) -> float:
    s = 0.0
    if a.folder_id == b.folder_id:
        s += 0.56
    if a.media_type == b.media_type:
        s += 0.34
    na = (a.name_no_ext or "").lower()[:4]
    nb = (b.name_no_ext or "").lower()[:4]
    if na and na == nb:
        s += 0.08
    return min(1.0, s)


def _mmr_head(items: list[MediaFile], scores: dict[str, float], lam: float = 0.74) -> list[MediaFile]:
    if len(items) <= 1:
        return items
    mx = max(scores[m.id] for m in items) or 1.0
    rel = {m.id: scores[m.id] / mx for m in items}
    selected: list[MediaFile] = []
    remaining = list(items)
    while remaining:
        best_m = None
        best_v = -1e18
        for m in remaining:
            r = rel[m.id]
            div = max((_sim(m, s) for s in selected[-18:]), default=0.0)
            v = lam * r - (1.0 - lam) * div
            if v > best_v:
                best_v = v
                best_m = m
        remaining.remove(best_m)
        selected.append(best_m)
    return selected


def _interleave_types(head: list[MediaFile]) -> list[MediaFile]:
    if len(head) < 4:
        return head
    buckets: dict[str, deque] = defaultdict(deque)
    for m in head:
        k = m.media_type if m.media_type in ("video", "image", "audio") else "other"
        buckets[k].append(m)
    order = ("video", "image", "audio", "other")
    out: list[MediaFile] = []
    while sum(len(buckets[t]) for t in order) > 0:
        for t in order:
            if buckets.get(t):
                out.append(buckets[t].popleft())
    return out


def build_candidate_pool(session: Session, stmt) -> list[MediaFile]:
    rows_new = session.exec(stmt.order_by(MediaFile.indexed_at.desc()).limit(680)).all()
    rows_hot = session.exec(stmt.order_by(MediaFile.play_count.desc()).limit(240)).all()
    fav_stmt = stmt.where(MediaFile.is_favorite == True).order_by(MediaFile.indexed_at.desc()).limit(140)  # noqa: E712
    fav_rows = session.exec(fav_stmt).all()
    wt_stmt = (
        stmt.where(col(MediaFile.watch_time_seconds) > 18)
        .order_by(col(MediaFile.watch_time_seconds).desc())
        .limit(200)
    )
    wt_rows = session.exec(wt_stmt).all()
    by_id: dict[str, MediaFile] = {r.id: r for r in rows_new}
    for r in rows_hot:
        by_id.setdefault(r.id, r)
    for r in fav_rows:
        by_id.setdefault(r.id, r)
    for r in wt_rows:
        by_id.setdefault(r.id, r)
    return list(by_id.values())


def rank_recommendation_pool(session: Session, stmt) -> list[MediaFile]:
    pool = build_candidate_pool(session, stmt)
    if not pool:
        return []
    ctx = build_taste_context(session)
    tg_ids = _telegram_media_id_set(session)
    scores = {m.id: personalized_score(m, ctx, tg_ids) for m in pool}
    ordered = sorted(pool, key=lambda m: scores[m.id], reverse=True)
    head_n = min(260, len(ordered))
    head = ordered[:head_n]
    tail = ordered[head_n:]
    head_mmr = _mmr_head(head, scores, lam=0.74)
    inter_len = min(88, len(head_mmr))
    head_mix = _interleave_types(head_mmr[:inter_len]) + head_mmr[inter_len:]
    return head_mix + tail
