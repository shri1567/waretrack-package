import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatNumber, formatDateTime, StatusPill } from '../utils.jsx';

function NewOutboundModal({ onClose, onSuccess }) {
  const [warehouses, setWarehouses] = useState([]);
  const [clients, setClients] = useState([]);
  const [skus, setSkus] = useState([]);
  const [form, setForm] = useState({
    warehouse_id: '', client_id: '', destination_address: '', destination_city: '',
    items: [{ sku_id: '', quantity: 1, unit_price: 0 }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.listWarehouses(), api.listClients(), api.listSKUs()])
      .then(([w, c, s]) => { setWarehouses(w.data); setClients(c.data); setSkus(s.data); });
  }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { sku_id: '', quantity: 1, unit_price: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const submit = async () => {
    setError(''); setSubmitting(true);
    try {
      await api.createOutbound({
        ...form,
        warehouse_id: Number(form.warehouse_id),
        client_id: Number(form.client_id),
        items: form.items.map(it => ({
          sku_id: Number(it.sku_id),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="card p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl text-ink-900">New Outbound Shipment</h2>
            <p className="text-xs text-ink-500 mt-1">Dispatched stock will be deducted automatically by triggers</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-4 p-3 rounded bg-rust-50 border border-rust-200 text-rust-700 text-xs">{error}</div>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="stat-label">Warehouse</label>
              <select className="input mt-1" value={form.warehouse_id} onChange={(e) => setForm({...form, warehouse_id: e.target.value})}>
                <option value="">Select…</option>
                {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_code} — {w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="stat-label">Client</label>
              <select className="input mt-1" value={form.client_id} onChange={(e) => setForm({...form, client_id: e.target.value})}>
                <option value="">Select…</option>
                {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.company_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="stat-label">Destination Address</label>
            <input className="input mt-1" value={form.destination_address} onChange={(e) => setForm({...form, destination_address: e.target.value})} />
          </div>
          <div>
            <label className="stat-label">Destination City</label>
            <input className="input mt-1" value={form.destination_city} onChange={(e) => setForm({...form, destination_city: e.target.value})} />
          </div>

          <div>
            <div className="flex items-center justify-between mt-4 mb-2">
              <label className="stat-label">Line Items</label>
              <button onClick={addItem} className="text-xs text-ink-600 hover:text-ink-900 inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select className="input col-span-6" value={it.sku_id} onChange={(e) => updateItem(i, 'sku_id', e.target.value)}>
                    <option value="">Select SKU…</option>
                    {skus.map(s => <option key={s.sku_id} value={s.sku_id}>{s.sku_code} — {s.product_name}</option>)}
                  </select>
                  <input className="input col-span-2" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                  <input className="input col-span-3" type="number" placeholder="Unit ₹" value={it.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} />
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="col-span-1 text-ink-400 hover:text-rust-600"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting ? 'Processing…' : 'Create Shipment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shipments() {
  const [tab, setTab] = useState('outbound');
  const [inbound, setInbound] = useState([]);
  const [outbound, setOutbound] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.listInbound(), api.listOutbound()])
      .then(([i, o]) => { setInbound(i.data); setOutbound(o.data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const list = tab === 'inbound' ? inbound : outbound;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-heading">Shipments</h1>
          <p className="section-subheading">Goods movement in and out of warehouses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Refresh</button>
          {tab === 'outbound' && (
            <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Outbound</button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 px-4 flex">
          {['outbound', 'inbound'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-700'
              }`}
            >
              {t === 'outbound' ? <span className="inline-flex items-center gap-1.5"><ArrowUp className="w-3.5 h-3.5" /> Outbound</span>
                                : <span className="inline-flex items-center gap-1.5"><ArrowDown className="w-3.5 h-3.5" /> Inbound</span>}
              <span className="ml-1.5 text-ink-400">({t === 'outbound' ? outbound.length : inbound.length})</span>
            </button>
          ))}
        </div>

        {loading ? <div className="p-12 text-center text-ink-400">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shipment #</th>
                  <th>{tab === 'inbound' ? 'Supplier' : 'Destination'}</th>
                  <th>Client</th>
                  <th>Warehouse</th>
                  <th>Date</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.inbound_id || s.outbound_id}>
                    <td className="font-mono text-xs text-ink-900">{s.shipment_number}</td>
                    <td className="text-sm">{tab === 'inbound' ? s.supplier_name : s.destination_city}</td>
                    <td className="text-sm text-ink-600">{s.client_name}</td>
                    <td className="font-mono text-xs text-ink-500">{s.warehouse_code}</td>
                    <td className="text-xs text-ink-600">{formatDateTime(s.arrival_date || s.dispatch_date)}</td>
                    <td className="text-right font-mono text-xs">{s.item_count}</td>
                    <td className="text-right font-mono">{formatCurrency(s.total_value)}</td>
                    <td><StatusPill status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <NewOutboundModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
