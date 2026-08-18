import { useEffect, useState } from 'react';
import { Star, Factory } from 'lucide-react';
import { api } from '../api';

export default function Suppliers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.listSuppliers().then(r => { setList(r.data); setLoading(false); }); }, []);

  if (loading) return <div className="text-ink-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Suppliers</h1>
        <p className="section-subheading">{list.length} vendors supplying goods to client inventories</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(s => (
          <div key={s.supplier_id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-ink-400">{s.supplier_code}</div>
                <h3 className="font-display text-xl text-ink-900 leading-tight mt-0.5 truncate">{s.company_name}</h3>
              </div>
              <Factory className="w-5 h-5 text-ink-300" />
            </div>
            <div className="mt-3 text-xs text-ink-500 space-y-1">
              <div>{s.contact_person}</div>
              <div className="font-mono text-ink-400 text-[11px]">{s.email}</div>
              <div className="text-ink-400">{s.address}</div>
            </div>
            <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(s.rating) ? 'text-amber-500 fill-amber-500' : 'text-ink-200'}`} />
                ))}
                <span className="text-xs text-ink-500 ml-1 font-mono">{s.rating}</span>
              </div>
              <div className="text-xs text-ink-500">{s.shipment_count} shipments</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
