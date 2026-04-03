import { useState, useEffect } from 'react';
import type { ColumnInfo, AIRecommendResponse, DatasetPreviewResponse, UseCaseSuggestion } from '../types';
import * as api from '../api';

interface Props {
  datasetId: string;
  columns: ColumnInfo[];
  targetColumn: string;
  featureColumns: string[];
  onTargetChange: (col: string) => void;
  onFeaturesChange: (cols: string[]) => void;
  onContinue: () => void;
}

export default function StepConfigureData({
  datasetId, columns, targetColumn, featureColumns,
  onTargetChange, onFeaturesChange, onContinue,
}: Props) {
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [useCase, setUseCase] = useState('');
  const [aiResult, setAiResult] = useState<AIRecommendResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  const [suggestions, setSuggestions] = useState<UseCaseSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    setSuggestionsLoading(true);
    api.suggestUseCases(datasetId)
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false));
  }, [datasetId]);

  const handleAIRecommend = async () => {
    if (!useCase.trim()) return;
    setAiLoading(true);
    try {
      const result = await api.aiRecommend(datasetId, useCase);
      setAiResult(result);
      onTargetChange(result.target_column);
      onFeaturesChange(result.features);
    } catch { /* ignore */ }
    finally { setAiLoading(false); }
  };

  const handleFeatureToggle = (col: string) => {
    if (col === targetColumn) return;
    const newFeatures = featureColumns.includes(col)
      ? featureColumns.filter((c) => c !== col)
      : [...featureColumns, col];
    onFeaturesChange(newFeatures);
  };

  const loadPreview = async () => {
    if (!preview) {
      try {
        const data = await api.getDatasetPreview(datasetId, 10);
        setPreview(data);
      } catch { /* ignore */ }
    }
    setActiveTab('preview');
  };

  const DTYPE_COLORS: Record<string, string> = {
    'object': '#e67e22',
    'float64': '#2ecc71',
    'int64': '#3498db',
    'bool': '#9b59b6',
  };

  return (
    <div className="aw-step-content">
      <div className="aw-step-main">
        <div className="aw-tab-bar">
          <button
            className={`aw-tab ${activeTab === 'config' ? 'aw-tab--active' : ''}`}
            onClick={() => setActiveTab('config')}
          >Column Configuration</button>
          <button
            className={`aw-tab ${activeTab === 'preview' ? 'aw-tab--active' : ''}`}
            onClick={loadPreview}
          >Dataset Preview</button>
        </div>

        {activeTab === 'config' && (
          <>
            <div className="aw-config-header">
              <h3>Column Configuration</h3>
              <p>Select target variable and feature columns</p>
            </div>
            <div className="aw-columns-table">
              <div className="aw-col-header">
                <span className="aw-col-check">Feature</span>
                <span className="aw-col-name">Column Name</span>
                <span className="aw-col-type">Type</span>
                <span className="aw-col-null">Nulls</span>
                <span className="aw-col-unique">Unique</span>
                <span className="aw-col-target">Target</span>
              </div>
              {columns.map((col) => (
                <div key={col.name} className={`aw-col-row ${col.name === targetColumn ? 'aw-col-row--target' : ''}`}>
                  <span className="aw-col-check">
                    <input
                      type="checkbox"
                      checked={featureColumns.includes(col.name)}
                      onChange={() => handleFeatureToggle(col.name)}
                      disabled={col.name === targetColumn}
                    />
                  </span>
                  <span className="aw-col-name">{col.name}</span>
                  <span className="aw-col-type">
                    <span className="aw-dtype-badge" style={{ backgroundColor: DTYPE_COLORS[col.dtype] || '#95a5a6' }}>
                      {col.dtype}
                    </span>
                  </span>
                  <span className="aw-col-null">{col.null_count}</span>
                  <span className="aw-col-unique">{col.unique_count}</span>
                  <span className="aw-col-target">
                    <input
                      type="radio"
                      name="target"
                      checked={col.name === targetColumn}
                      onChange={() => {
                        onTargetChange(col.name);
                        onFeaturesChange(columns.filter((c) => c.name !== col.name).map((c) => c.name));
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
            <button className="aw-btn aw-btn--primary aw-btn--full" onClick={onContinue} disabled={!targetColumn}>
              Continue →
            </button>
          </>
        )}

        {activeTab === 'preview' && preview && (
          <div className="aw-preview-table-wrap">
            <table className="aw-preview-table">
              <thead>
                <tr>{preview.columns.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>{preview.columns.map((c) => <td key={c}>{String(row[c] ?? '')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="aw-step-sidebar">
        <div className="aw-ai-panel">
          <h4>🤖 AI Assistant</h4>
          <p className="aw-ai-desc">Describe your use case and let AI recommend the optimal configuration</p>

          {suggestions.length > 0 && (
            <div className="aw-ai-suggestions">
              <label className="aw-ai-label">💡 Suggested Use Cases</label>
              <div className="aw-suggestion-chips">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className={`aw-suggestion-chip ${useCase === s.use_case ? 'aw-suggestion-chip--active' : ''}`}
                    onClick={() => setUseCase(s.use_case)}
                  >
                    <span className="aw-suggestion-text">{s.use_case}</span>
                    <span className={`aw-suggestion-task aw-suggestion-task--${s.ml_task}`}>{s.ml_task}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {suggestionsLoading && <p className="aw-ai-desc">Analyzing dataset for suggestions...</p>}

          <label className="aw-ai-label">Your Use Case</label>
          <textarea
            className="aw-ai-input"
            placeholder="e.g., I want to classify iris species"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            rows={3}
          />
          <button className="aw-btn aw-btn--primary aw-btn--full" onClick={handleAIRecommend} disabled={aiLoading || !useCase.trim()}>
            {aiLoading ? 'Generating...' : '🤖 Generate Configuration'}
          </button>

          {aiResult && (
            <div className="aw-ai-result">
              <div className="aw-ai-result-header">
                <span>✨ AI Recommendation</span>
                <span className="aw-badge aw-badge--green">{aiResult.confidence}</span>
              </div>
              <div className="aw-ai-field">
                <label>Target Column</label>
                <span className="aw-badge aw-badge--orange">{aiResult.target_column}</span>
              </div>
              <div className="aw-ai-field">
                <label>Features Selected</label>
                <span className="aw-ai-features-count">{aiResult.features.length} features</span>
              </div>
              <div className="aw-ai-reasoning">
                <h5>📋 Reasoning</h5>
                <p>{aiResult.reasoning}</p>
              </div>
              <div className="aw-ai-applied-msg">
                ℹ️ Configuration applied. Review the table and adjust if needed.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
