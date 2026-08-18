import { useEffect, useState } from 'react';
import { Search, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatNumber, formatDate, StatusPill } from '../utils.jsx';

export default function Inventory() {
  const [skus, setSkus] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listSKUs().then((r) => { setSkus(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-ink-400">Loading inventory…</div>;

  const filtered = skus.filter((s) => {
    const matchesSearch = !search ||
      s.sku_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'expiring' && s.days_to_expiry !== null && s.days_to_expiry <= 30) ||
      (filter === 'expired' && s.days_to_expiry !== null && s.days_to_expiry < 0) ||
      (filter === 'lowstock' && s.total_stock < 50);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-heading">Inventory</h1>
          <p className="section-subheading">{skus.length} SKUs across all warehouses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU code, product, client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1">
          {[
            { val: 'all',      label: 'All' },
            { val: 'expiring', label: 'Expiring 30d' },
            { val: 'expired',  label: 'Expired' },
            { val: 'lowstock', label: 'Low Stock' },
          ].map(f => (
            <button
              key={f.val}
              onClick={() => setFilter(f.val)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                filter === f.val
                  ? 'bg-ink-900 text-cream-50 border-ink-900'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Product</th>
                <th>Client</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Unit Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center text-ink-400 py-12">No SKUs match filters</td></tr>
              )}
              {filtered.map((s) => {
                const expiring = s.days_to_expiry !== null && s.days_to_expiry >= 0 && s.days_to_expiry <= 30;
                const expired  = s.days_to_expiry !== null && s.days_to_expiry < 0;
                return (
                  <tr key={s.sku_id}>
                    <td className="font-mono text-xs text-ink-900">{s.sku_code}</td>
                    <td>
                      <div className="text-ink-900">{s.product_name}</div>
                      <div className="text-[10px] text-ink-400 font-mono">{s.product_code}</div>
                    </td>
                    <td className="text-ink-600 text-xs">{s.client_name}</td>
                    <td className="font-mono text-xs text-ink-500">{s.batch_number}</td>
                    <td>
                      {s.expiry_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3 h-3 ${expired ? 'text-rust-600' : expiring ? 'text-amber-600' : 'text-ink-400'}`} />
                          <span className={expired ? 'text-rust-700 font-medium' : expiring ? 'text-amber-700 font-medium' : 'text-ink-600'}>
                            {formatDate(s.expiry_date)}
                          </span>
                          {(expiring || expired) && (
                            <span className="text-[10px] text-ink-400">
                              ({expired ? `${Math.abs(s.days_to_expiry)}d ago` : `${s.days_to_expiry}d left`})
                            </span>
                          )}
                        </div>
                      ) : <span className="text-ink-300 text-xs">—</span>}
                    </td>
                    <td className="text-right font-mono">{formatNumber(s.total_stock)}</td>
                    <td className="text-right font-mono">{formatCurrency(s.cost_per_unit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
