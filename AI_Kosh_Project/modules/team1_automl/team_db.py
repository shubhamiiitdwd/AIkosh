import sqlite3
import json
from pathlib import Path
from .config import TEAM_DB_PATH
from .schemas import DatasetMetadata
from .enums import TrainingStatus

_DB_PATH = str(TEAM_DB_PATH)


def _get_conn():
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                total_rows INTEGER,
                total_columns INTEGER,
                size_bytes INTEGER,
                category TEXT DEFAULT 'Uploaded Dataset',
                description TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS training_runs (
                run_id TEXT PRIMARY KEY,
                dataset_id TEXT,
                config TEXT,
                status TEXT DEFAULT 'queued',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)


init_db()


def _cleanup_duplicate_datasets():
    with _get_conn() as conn:
        conn.execute("""
            DELETE FROM datasets WHERE rowid NOT IN (
                SELECT MAX(rowid) FROM datasets GROUP BY filename
            )
        """)


_cleanup_duplicate_datasets()


def save_dataset(meta: DatasetMetadata):
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO datasets (id, filename, total_rows, total_columns, size_bytes, category, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (meta.id, meta.filename, meta.total_rows, meta.total_columns, meta.size_bytes, meta.category, meta.description),
        )


def list_datasets() -> list[DatasetMetadata]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM datasets GROUP BY filename ORDER BY rowid DESC"
        ).fetchall()
    return [DatasetMetadata(**dict(r)) for r in rows]


def get_dataset(dataset_id: str):
    with _get_conn() as conn:
        row = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
    if row:
        return DatasetMetadata(**dict(row))
    return None


def find_dataset_by_filename(filename: str):
    with _get_conn() as conn:
        row = conn.execute("SELECT * FROM datasets WHERE filename = ?", (filename,)).fetchone()
    if row:
        return DatasetMetadata(**dict(row))
    return None


def delete_dataset(dataset_id: str):
    with _get_conn() as conn:
        conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))


def save_training_run(run_id: str, req, status: TrainingStatus):
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO training_runs (run_id, dataset_id, config, status) VALUES (?, ?, ?, ?)",
            (run_id, req.dataset_id, json.dumps(req.model_dump(), default=str), status.value),
        )


def update_training_run(run_id: str, status: TrainingStatus):
    with _get_conn() as conn:
        conn.execute(
            "UPDATE training_runs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE run_id = ?",
            (status.value, run_id),
        )


def get_training_run(run_id: str):
    with _get_conn() as conn:
        row = conn.execute("SELECT * FROM training_runs WHERE run_id = ?", (run_id,)).fetchone()
    return dict(row) if row else None
