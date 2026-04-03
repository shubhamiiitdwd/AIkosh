import { useState, useRef, useEffect } from 'react';
import type { DatasetMetadata } from '../types';
import * as api from '../api';

interface Props {
  dataset: DatasetMetadata | null;
  onSelect: (ds: DatasetMetadata) => void;
}

export default function StepSelectDataset({ dataset, onSelect }: Props) {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.listDatasets().then(setDatasets).catch(() => {});
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ds = await api.uploadDataset(file);
      setDatasets((prev) => {
        const filtered = prev.filter((d) => d.filename !== ds.filename);
        return [...filtered, ds];
      });
      onSelect(ds);
    } catch (e) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, ds: DatasetMetadata) => {
    e.stopPropagation();
    try {
      await api.deleteDataset(ds.id);
      setDatasets((prev) => prev.filter((d) => d.id !== ds.id));
    } catch { /* ignore */ }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleUpload(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="aw-step-content">
      <div className="aw-step-main">
        <button className="aw-back-btn" disabled>← Back</button>

        {dataset ? (
          <div className="aw-dataset-info">
            <h3 className="aw-dataset-name">{dataset.filename}</h3>
            <p className="aw-dataset-desc">{dataset.description}</p>
            <div className="aw-meta-cards">
              <div className="aw-meta-card">
                <span className="aw-meta-label">Total Rows</span>
                <span className="aw-meta-value">{dataset.total_rows}</span>
              </div>
              <div className="aw-meta-card">
                <span className="aw-meta-label">Total Columns</span>
                <span className="aw-meta-value">{dataset.total_columns}</span>
              </div>
              <div className="aw-meta-card">
                <span className="aw-meta-label">Size</span>
                <span className="aw-meta-value">{formatSize(dataset.size_bytes)}</span>
              </div>
              <div className="aw-meta-card">
                <span className="aw-meta-label">Category</span>
                <span className="aw-badge">{dataset.category}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`aw-upload-zone ${dragOver ? 'aw-upload-zone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div className="aw-upload-icon">📁</div>
              <p>{uploading ? 'Uploading...' : 'Drag & drop a CSV file here, or click to browse'}</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </div>

            {datasets.length > 0 && (
              <div className="aw-dataset-catalog">
                <h4>Or select from existing datasets:</h4>
                <div className="aw-dataset-list">
                  {datasets.map((ds) => (
                    <div key={ds.id} className="aw-dataset-item" onClick={() => onSelect(ds)}>
                      <span className="aw-dataset-item-name">{ds.filename}</span>
                      <div className="aw-dataset-item-right">
                        <span className="aw-dataset-item-meta">{ds.total_rows} rows · {ds.total_columns} cols</span>
                        <button className="aw-dataset-delete-btn" onClick={(e) => handleDelete(e, ds)} title="Delete dataset">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="aw-step-sidebar">
        <h4>AutoML Workflow:</h4>
        <ul className="aw-workflow-list">
          <li className="aw-workflow-active">Search catalog for datasets</li>
          <li>Preview and configure data columns</li>
          <li>Select ML task and models</li>
          <li>Configure training settings</li>
          <li>Train and compare models</li>
          <li>View results and export</li>
        </ul>
      </div>
    </div>
  );
}
