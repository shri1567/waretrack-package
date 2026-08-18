import { useEffect, useState } from 'react';
import { Users, Building2, IndianRupee, Search } from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatDate } from '../utils.jsx';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listClients().then((r) => { setClients(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-ink-400">Loading clients…</div>;

  const filtered = clients.filter(c =>
    !search ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-heading">Clients</h1>
          <p className="section-subheading">{clients.length} B2B customers using our warehousing services</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input pl-9" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <div key={c.client_id} className="card p-5 hover:shadow-lift transition-shadow">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] text-ink-400">{c.client_code}</div>
                <h3 className="font-display text-xl text-ink-900 leading-tight mt-0.5 truncate">{c.company_name}</h3>
                <div className="text-xs text-ink-500 mt-1.5">
                  {c.contact_person} · {c.email}
                </div>
                <div className="text-xs text-ink-400 font-mono mt-1">{c.city}, {c.state}</div>
                {c.gst_number && <div className="text-[10px] text-ink-400 font-mono mt-1">GST: {c.gst_number}</div>}
              </div>
              <div className={`pill ${c.is_active ? 'bg-forest-50 text-forest-700 border-forest-100' : 'bg-ink-50 text-ink-500 border-ink-200'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-3 gap-3">
              <div>
                <div className="stat-label">Products</div>
                <div className="font-display text-lg text-ink-900 mt-0.5">{c.product_count || 0}</div>
              </div>
              <div>
                <div className="stat-label">Credit Limit</div>
                <div className="font-display text-base text-ink-900 mt-0.5">{formatCurrency(c.credit_limit)}</div>
              </div>
              <div>
                <div className="stat-label">Outstanding</div>
                <div className={`font-display text-base mt-0.5 ${(c.outstanding_balance || 0) > 0 ? 'text-amber-700' : 'text-ink-900'}`}>
                  {formatCurrency(c.outstanding_balance || 0)}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-ink-100 flex justify-between text-[10px] text-ink-400">
              <span>Terms: NET {c.payment_terms_days} days</span>
              <span>Since {formatDate(c.onboarded_date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
