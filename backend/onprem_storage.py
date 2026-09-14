"""
On-prem local filesystem storage backend for document uploads.
Used when STORAGE_MODE=local, mapping to a persistent Docker volume
(`/data/uploads` in the shipped docker-compose.yml). NOT for use as
pod-local ephemeral storage — the deployment is expected to mount a
durable volume at LOCAL_STORAGE_DIR.
"""
from __future__ import annotations
from pathlib import Path


def write_blob(base_dir: str, rel_path: str, data: bytes) -> dict:
    target = Path(base_dir) / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"path": rel_path, "size": len(data)}


def read_blob(base_dir: str, rel_path: str) -> bytes | None:
    target = Path(base_dir) / rel_path
    if not target.exists():
        return None
    return target.read_bytes()
