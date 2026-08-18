import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { formatDateTime, StatusPill } from '../utils.jsx';

const severityIcon = {
  CRITICAL: { Icon: AlertCircle,    className: 'text-rust-600' },
  WARNING:  { Icon: AlertTriangle,  className: 'text-amber-600' },
  INFO:     { Icon: Info,           className: 'text-ink-500' },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  const load = () => {
    setLoading(true);
    const params = filter === 'open' ? { resolved: false } : filter === 'resolved' ? { resolved: true } : {};
    api.listAlerts(params).then(r => { setAlerts(r.data); setLoading(false); });
  };
  useEffect(() => { load(); }, [filter]);

  const resolve = async (id) => { await api.resolveAlert(id); load(); };
  const regenerate = async () => { await api.regenerateExpiryAlerts(); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-heading">Stock Alerts</h1>
          <p className="section-subheading">System-generated warnings from triggers and procedures</p>
        </div>
        <button onClick={regenerate} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Regenerate Expiry Alerts
        </button>
      </div>

      <div className="flex gap-1">
        {[
          { val: 'open',     label: 'Unresolved' },
          { val: 'resolved', label: 'Resolved' },
          { val: 'all',      label: 'All' },
        ].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              filter === f.val ? 'bg-ink-900 text-cream-50 border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-ink-400">Loading…</div> : (
        <div className="space-y-2">
          {alerts.length === 0 && (
            <div className="card p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-forest-500 mx-auto mb-3" />
              <div className="font-display text-xl text-ink-900">All clear!</div>
              <div className="text-sm text-ink-500 mt-1">No alerts match the selected filter.</div>
            </div>
          )}
          {alerts.map(a => {
            const sev = severityIcon[a.severity] || severityIcon.INFO;
            return (
              <div key={a.alert_id} className="card p-4 flex items-start gap-4">
                <div className={`mt-0.5 ${sev.className}`}>
                  <sev.Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={a.severity} />
                    <span className="text-xs font-mono text-ink-500">{a.alert_type}</span>
                    {a.warehouse_code && <span className="text-xs text-ink-400">· {a.warehouse_code}</span>}
                    <span className="text-[10px] text-ink-400 font-mono">· {formatDateTime(a.created_at)}</span>
                  </div>
                  <div className="text-sm text-ink-800 mt-1">{a.message}</div>
                  {a.product_name && <div className="text-xs text-ink-500 mt-0.5">Product: {a.product_name}</div>}
                </div>
                {!a.is_resolved && (
                  <button onClick={() => resolve(a.alert_id)} className="btn-secondary text-xs">
                    Resolve
                  </button>
                )}
                {a.is_resolved && <div className="pill bg-forest-50 text-forest-700 border-forest-100">Resolved</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
