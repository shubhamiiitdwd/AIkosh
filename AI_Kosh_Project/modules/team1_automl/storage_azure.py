"""
Azure Blob Storage implementation.
Activated when AZURE_STORAGE_CONNECTION_STRING is set in .env.
"""
import logging
from pathlib import Path
from .config import (
    AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_CONTAINER_DATASETS,
    AZURE_STORAGE_CONTAINER_MODELS,
    RAW_UPLOADS_DIR,
    MODELS_DIR,
)

logger = logging.getLogger(__name__)

_blob_service = None


def _get_blob_service():
    global _blob_service
    if _blob_service is None:
        try:
            from azure.storage.blob import BlobServiceClient
            _blob_service = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
            for container_name in [AZURE_STORAGE_CONTAINER_DATASETS, AZURE_STORAGE_CONTAINER_MODELS]:
                try:
                    _blob_service.create_container(container_name)
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Azure Blob init failed: {e}")
            raise
    return _blob_service


class AzureStorage:
    def save_dataset(self, dataset_id: str, filename: str, content: bytes) -> str:
        blob_service = _get_blob_service()
        blob_name = f"{dataset_id}/{filename}"
        blob_client = blob_service.get_blob_client(AZURE_STORAGE_CONTAINER_DATASETS, blob_name)
        blob_client.upload_blob(content, overwrite=True)

        local_dir = RAW_UPLOADS_DIR / dataset_id
        local_dir.mkdir(parents=True, exist_ok=True)
        local_path = local_dir / filename
        local_path.write_bytes(content)
        return str(local_path)

    def get_dataset_path(self, dataset_id: str, filename: str) -> str:
        local_path = RAW_UPLOADS_DIR / dataset_id / filename
        if local_path.exists():
            return str(local_path)

        blob_service = _get_blob_service()
        blob_name = f"{dataset_id}/{filename}"
        blob_client = blob_service.get_blob_client(AZURE_STORAGE_CONTAINER_DATASETS, blob_name)
        data = blob_client.download_blob().readall()

        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(data)
        return str(local_path)

    def delete_dataset(self, dataset_id: str, filename: str):
        try:
            blob_service = _get_blob_service()
            blob_name = f"{dataset_id}/{filename}"
            blob_client = blob_service.get_blob_client(AZURE_STORAGE_CONTAINER_DATASETS, blob_name)
            blob_client.delete_blob()
        except Exception as e:
            logger.warning(f"Azure blob delete failed: {e}")

        import shutil
        local_dir = RAW_UPLOADS_DIR / dataset_id
        if local_dir.exists():
            shutil.rmtree(local_dir)

    def save_model(self, run_id: str, filename: str, content: bytes) -> str:
        blob_service = _get_blob_service()
        blob_name = f"{run_id}/{filename}"
        blob_client = blob_service.get_blob_client(AZURE_STORAGE_CONTAINER_MODELS, blob_name)
        blob_client.upload_blob(content, overwrite=True)

        local_dir = MODELS_DIR / run_id
        local_dir.mkdir(parents=True, exist_ok=True)
        local_path = local_dir / filename
        local_path.write_bytes(content)
        return str(local_path)

    def list_datasets(self) -> list[str]:
        try:
            blob_service = _get_blob_service()
            container_client = blob_service.get_container_client(AZURE_STORAGE_CONTAINER_DATASETS)
            blobs = container_client.list_blobs()
            ids = set()
            for blob in blobs:
                parts = blob.name.split("/")
                if len(parts) >= 2:
                    ids.add(parts[0])
            return list(ids)
        except Exception:
            return []
