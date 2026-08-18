import { useEffect, useState } from 'react';
import { Warehouse, MapPin, Phone, Mail } from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatNumber } from '../utils.jsx';

export default function Warehouses() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listWarehouses().then((r) => { setList(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-ink-400">Loading…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">Warehouses</h1>
        <p className="section-subheading">{list.length} active facilities across India</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((w) => (
          <div key={w.warehouse_id} className="card p-5 hover:shadow-lift transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-xs text-ink-400">{w.warehouse_code}</div>
                <h3 className="font-display text-xl text-ink-900 leading-tight mt-1">{w.name}</h3>
              </div>
              <Warehouse className="w-5 h-5 text-ink-300" />
            </div>

            <div className="mt-4 text-xs text-ink-500 space-y-1.5">
              <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{w.address_line}, {w.city}, {w.state} - {w.pincode}</span></div>
              {w.contact_phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{w.contact_phone}</span></div>}
              {w.contact_email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" /><span>{w.contact_email}</span></div>}
            </div>

            <div className="mt-5 pt-4 border-t border-ink-100">
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="stat-label">Capacity Utilization</span>
                <span className="font-mono font-medium text-ink-900">{w.utilization_pct || 0}%</span>
              </div>
              <div className="h-1.5 bg-ink-50 rounded-full overflow-hidden">
                <div className="h-full bg-ink-900 rounded-full" style={{ width: `${Math.min(100, w.utilization_pct || 0)}%` }}></div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-ink-100">
              <div>
                <div className="stat-label">SKUs</div>
                <div className="font-display text-lg text-ink-900 mt-0.5">{w.unique_skus || 0}</div>
              </div>
              <div>
                <div className="stat-label">Units</div>
                <div className="font-display text-lg text-ink-900 mt-0.5">{formatNumber(w.total_units || 0)}</div>
              </div>
              <div>
                <div className="stat-label">Value</div>
                <div className="font-display text-lg text-ink-900 mt-0.5">{formatCurrency(w.inventory_value || 0)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
