import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { LeaderboardResponse, FeatureImportanceResponse } from '../types';
import * as api from '../api';

interface Props {
  runId: string;
}

export default function StepResults({ runId }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [featureImp, setFeatureImp] = useState<FeatureImportanceResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'features' | 'comparison'>('leaderboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [lb, fi] = await Promise.all([
          api.getLeaderboard(runId),
          api.getFeatureImportance(runId).catch(() => null),
        ]);
        setLeaderboard(lb);
        setFeatureImp(fi);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [runId]);

  if (loading) {
    return <div className="aw-loading">Loading results...</div>;
  }

  if (!leaderboard) {
    return <div className="aw-error">No results available yet.</div>;
  }

  const metricKeys = leaderboard.models[0]
    ? Object.keys(leaderboard.models[0].metrics).filter((k) => leaderboard.models[0].metrics[k] != null)
    : [];

  const COLORS = ['#e67e22', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c', '#f39c12', '#34495e'];

  const featureData = (featureImp?.features || []).slice(0, 10).map((f: Record<string, unknown>) => ({
    name: String(f.variable || f.name || ''),
    importance: Number(f.scaled_importance || f.relative_importance || f.percentage || 0),
  }));

  const comparisonData = leaderboard.models.slice(0, 8).map((m) => ({
    name: `#${m.rank} ${m.algorithm}`,
    ...Object.fromEntries(metricKeys.map((k) => [k, m.metrics[k] ?? 0])),
  }));

  return (
    <div className="aw-step-content">
      <div className="aw-step-main aw-step-main--wide">
        <div className="aw-results-tabs">
          <button className={`aw-tab ${activeTab === 'leaderboard' ? 'aw-tab--active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            🏆 Leaderboard
          </button>
          <button className={`aw-tab ${activeTab === 'features' ? 'aw-tab--active' : ''}`} onClick={() => setActiveTab('features')}>
            📊 Feature Importance
          </button>
          <button className={`aw-tab ${activeTab === 'comparison' ? 'aw-tab--active' : ''}`} onClick={() => setActiveTab('comparison')}>
            📈 Model Comparison
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <div className="aw-leaderboard">
            <table className="aw-lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Model</th>
                  <th>Algorithm</th>
                  {metricKeys.map((k) => <th key={k}>{k.toUpperCase()}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.models.map((m) => (
                  <tr key={m.model_id} className={m.is_best ? 'aw-lb-row--best' : ''}>
                    <td>#{m.rank}</td>
                    <td className="aw-lb-model-id">{m.model_id}</td>
                    <td>{m.algorithm}</td>
                    {metricKeys.map((k) => (
                      <td key={k}>{m.metrics[k] != null ? Number(m.metrics[k]).toFixed(4) : '-'}</td>
                    ))}
                    <td>{m.is_best && <span className="aw-badge aw-badge--green">🏆 Best</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'features' && featureData.length > 0 && (
          <div className="aw-chart-container">
            <h3>Feature Importance (Top 10)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={featureData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} />
                <Tooltip />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                  {featureData.map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'comparison' && comparisonData.length > 0 && (
          <div className="aw-chart-container">
            <h3>Model Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                {metricKeys.slice(0, 3).map((k, i) => (
                  <Bar key={k} dataKey={k} fill={COLORS[i]} name={k.toUpperCase()} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="aw-export-section">
          <h4>Export Results</h4>
          <div className="aw-export-buttons">
            <a href={api.getExportUrl(runId, 'csv')} className="aw-btn aw-btn--secondary" download>
              📥 Download CSV
            </a>
            <a href={api.getExportUrl(runId, 'json')} className="aw-btn aw-btn--secondary" download>
              📥 Download JSON
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
