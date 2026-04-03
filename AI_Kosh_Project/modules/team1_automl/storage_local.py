import shutil
from pathlib import Path
from .config import RAW_UPLOADS_DIR, MODELS_DIR


class LocalStorage:
    def save_dataset(self, dataset_id: str, filename: str, content: bytes) -> str:
        dest_dir = RAW_UPLOADS_DIR / dataset_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        filepath = dest_dir / filename
        filepath.write_bytes(content)
        return str(filepath)

    def get_dataset_path(self, dataset_id: str, filename: str) -> str:
        return str(RAW_UPLOADS_DIR / dataset_id / filename)

    def delete_dataset(self, dataset_id: str, filename: str):
        dest_dir = RAW_UPLOADS_DIR / dataset_id
        if dest_dir.exists():
            shutil.rmtree(dest_dir)

    def save_model(self, run_id: str, filename: str, content: bytes) -> str:
        dest_dir = MODELS_DIR / run_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        filepath = dest_dir / filename
        filepath.write_bytes(content)
        return str(filepath)

    def list_datasets(self) -> list[str]:
        if not RAW_UPLOADS_DIR.exists():
            return []
        return [d.name for d in RAW_UPLOADS_DIR.iterdir() if d.is_dir()]
