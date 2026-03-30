import hashlib


def stable_media_id(file_path: str) -> str:
    return hashlib.md5(file_path.encode("utf-8"), usedforsecurity=False).hexdigest()
