import { useEffect, useState } from 'react';
import { FileText, Plus, X, IndianRupee, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatDate, StatusPill } from '../utils.jsx';

function PaymentModal({ invoice, onClose, onSuccess }) {
  const [form, setForm] = useState({
    payment_reference: `PAY-${Date.now()}`,
    amount: invoice.total_amount - invoice.amount_paid,
    payment_mode: 'NEFT',
    transaction_id: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError(''); setSubmitting(true);
    try {
      await api.recordPayment(invoice.invoice_id, {
        ...form,
        amount: Number(form.amount),
      });
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="card p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl text-ink-900">Record Payment</h2>
            <p className="text-xs text-ink-500 mt-1">{invoice.invoice_number} · {invoice.client_name}</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-4 p-3 rounded bg-rust-50 border border-rust-200 text-rust-700 text-xs">{error}</div>}

        <div className="bg-ink-50 rounded p-3 text-sm mb-4">
          <div className="flex justify-between text-xs"><span className="text-ink-500">Invoice Total</span><span className="font-mono">{formatCurrency(invoice.total_amount)}</span></div>
          <div className="flex justify-between text-xs mt-1"><span className="text-ink-500">Already Paid</span><span className="font-mono">{formatCurrency(invoice.amount_paid)}</span></div>
          <div className="flex justify-between mt-2 pt-2 border-t border-ink-200 font-medium"><span>Balance Due</span><span className="font-mono">{formatCurrency(invoice.total_amount - invoice.amount_paid)}</span></div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="stat-label">Reference</label>
            <input className="input mt-1 font-mono text-xs" value={form.payment_reference} onChange={(e) => setForm({...form, payment_reference: e.target.value})} />
          </div>
          <div>
            <label className="stat-label">Amount (₹)</label>
            <input className="input mt-1" type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
          </div>
          <div>
            <label className="stat-label">Payment Mode</label>
            <select className="input mt-1" value={form.payment_mode} onChange={(e) => setForm({...form, payment_mode: e.target.value})}>
              {['NEFT','RTGS','UPI','CHEQUE','CARD','CASH'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="stat-label">Transaction ID</label>
            <input className="input mt-1 font-mono text-xs" value={form.transaction_id} onChange={(e) => setForm({...form, transaction_id: e.target.value})} placeholder="optional" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : 'Record Payment'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [paymentFor, setPaymentFor] = useState(null);

  const load = () => {
    setLoading(true);
    api.listInvoices().then(r => { setList(r.data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? list : list.filter(i => i.status === filter);
  const totalOutstanding = list.reduce((sum, i) => sum + Number(i.balance_due || 0), 0);
  const overdueCount = list.filter(i => i.status === 'OVERDUE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-heading">Invoices</h1>
          <p className="section-subheading">{list.length} invoices · {formatCurrency(totalOutstanding)} outstanding</p>
        </div>
        <button onClick={async () => { await api.markOverdue(); load(); }} className="btn-secondary">
          <AlertCircle className="w-4 h-4" /> Mark Overdue
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="stat-label">Total Invoices</div>
          <div className="font-display text-2xl text-ink-900 mt-1">{list.length}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Outstanding</div>
          <div className="font-display text-2xl text-amber-700 mt-1">{formatCurrency(totalOutstanding)}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Overdue</div>
          <div className={`font-display text-2xl mt-1 ${overdueCount > 0 ? 'text-rust-700' : 'text-ink-900'}`}>{overdueCount}</div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['all', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              filter === f ? 'bg-ink-900 text-cream-50 border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
            }`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="p-12 text-center text-ink-400">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Period</th>
                  <th>Due Date</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.invoice_id}>
                    <td className="font-mono text-xs text-ink-900">{i.invoice_number}</td>
                    <td className="text-sm">{i.client_name}</td>
                    <td className="text-xs text-ink-600">{i.billing_month}/{i.billing_year}</td>
                    <td className="text-xs text-ink-600">
                      {formatDate(i.due_date)}
                      {i.days_overdue > 0 && <span className="text-rust-600 ml-1">({i.days_overdue}d)</span>}
                    </td>
                    <td className="text-right font-mono">{formatCurrency(i.total_amount)}</td>
                    <td className="text-right font-mono text-ink-600">{formatCurrency(i.amount_paid)}</td>
                    <td className="text-right font-mono font-medium">{formatCurrency(i.balance_due)}</td>
                    <td><StatusPill status={i.status} /></td>
                    <td>
                      {Number(i.balance_due) > 0 && (
                        <button onClick={() => setPaymentFor(i)} className="text-xs text-forest-700 hover:text-forest-800 font-medium">
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paymentFor && <PaymentModal invoice={paymentFor} onClose={() => setPaymentFor(null)} onSuccess={() => { setPaymentFor(null); load(); }} />}
    </div>
  );
}
