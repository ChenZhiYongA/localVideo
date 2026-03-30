from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, col, func, select

from database import get_session
from models import Comment, Reaction
from schemas import (
    CommentCreate,
    CommentOut,
    CommentsResponse,
    ReactionSummary,
    ReactionsResponse,
    ReactionToggle,
)

router = APIRouter(prefix="/api/media", tags=["social"])


def _comment_out(c: Comment, replies: Optional[List["CommentOut"]] = None) -> CommentOut:
    return CommentOut(
        id=c.id,
        media_id=c.media_id,
        parent_id=c.parent_id,
        author=c.author,
        content=c.content,
        created_at=c.created_at.isoformat(),
        replies=replies or [],
    )


@router.get("/{media_id}/comments", response_model=CommentsResponse)
def get_comments(
    media_id: str,
    session: Session = Depends(get_session),
):
    top_level = session.exec(
        select(Comment)
        .where(Comment.media_id == media_id, Comment.parent_id == None)
        .order_by(Comment.created_at.desc())
    ).all()

    all_replies = session.exec(
        select(Comment)
        .where(Comment.media_id == media_id, Comment.parent_id != None)
        .order_by(Comment.created_at.asc())
    ).all()
    reply_map: dict[int, list[Comment]] = {}
    for r in all_replies:
        reply_map.setdefault(r.parent_id, []).append(r)

    items = []
    for c in top_level:
        replies = [_comment_out(r) for r in reply_map.get(c.id, [])]
        items.append(_comment_out(c, replies))

    total_stmt = select(func.count()).select_from(Comment).where(Comment.media_id == media_id)
    total = session.exec(total_stmt).one()
    return CommentsResponse(items=items, total=int(total or 0))


@router.post("/{media_id}/comments", response_model=CommentOut)
def create_comment(
    media_id: str,
    body: CommentCreate,
    session: Session = Depends(get_session),
):
    if body.parent_id is not None:
        parent = session.get(Comment, body.parent_id)
        if not parent or parent.media_id != media_id:
            raise HTTPException(404, "parent comment not found")

    c = Comment(
        media_id=media_id,
        parent_id=body.parent_id,
        author=body.author.strip() or "用户",
        content=body.content.strip(),
    )
    session.add(c)
    session.commit()
    session.refresh(c)
    return _comment_out(c)


@router.delete("/{media_id}/comments/{comment_id}")
def delete_comment(
    media_id: str,
    comment_id: int,
    session: Session = Depends(get_session),
):
    c = session.get(Comment, comment_id)
    if not c or c.media_id != media_id:
        raise HTTPException(404)
    replies = session.exec(
        select(Comment).where(Comment.parent_id == comment_id)
    ).all()
    for r in replies:
        session.delete(r)
    session.delete(c)
    session.commit()
    return {"deleted": True}


@router.get("/{media_id}/reactions", response_model=ReactionsResponse)
def get_reactions(
    media_id: str,
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(Reaction.emoji, func.count())
        .where(Reaction.media_id == media_id)
        .group_by(Reaction.emoji)
    ).all()
    items = [ReactionSummary(emoji=e, count=c) for e, c in rows]
    total = sum(i.count for i in items)
    return ReactionsResponse(items=items, total=total)


@router.post("/{media_id}/reactions", response_model=ReactionsResponse)
def toggle_reaction(
    media_id: str,
    body: ReactionToggle,
    session: Session = Depends(get_session),
):
    r = Reaction(media_id=media_id, emoji=body.emoji)
    session.add(r)
    session.commit()
    return get_reactions(media_id, session)
