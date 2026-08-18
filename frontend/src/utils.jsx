// Currency formatter — Indian Rupee with lakh/crore grouping
export const formatCurrency = (n) => {
  const value = Number(n) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(Number(n) || 0);

export const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return d; }
};

export const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return d; }
};

// Status pill colors
export const statusColors = {
  PAID:       'bg-forest-50 text-forest-700 border-forest-100',
  ISSUED:     'bg-ink-50 text-ink-600 border-ink-200',
  PARTIAL:    'bg-amber-50 text-amber-700 border-amber-100',
  OVERDUE:    'bg-rust-50 text-rust-700 border-rust-100',
  DRAFT:      'bg-ink-50 text-ink-500 border-ink-200',
  CANCELLED:  'bg-ink-50 text-ink-400 border-ink-200',
  DELIVERED:  'bg-forest-50 text-forest-700 border-forest-100',
  IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-100',
  DISPATCHED: 'bg-amber-50 text-amber-700 border-amber-100',
  PENDING:    'bg-ink-50 text-ink-500 border-ink-200',
  PICKING:    'bg-amber-50 text-amber-700 border-amber-100',
  STORED:     'bg-forest-50 text-forest-700 border-forest-100',
  ARRIVED:    'bg-amber-50 text-amber-700 border-amber-100',
  SCHEDULED:  'bg-ink-50 text-ink-500 border-ink-200',
  CRITICAL:   'bg-rust-50 text-rust-700 border-rust-200',
  WARNING:    'bg-amber-50 text-amber-700 border-amber-200',
  INFO:       'bg-ink-50 text-ink-600 border-ink-200',
  EXCELLENT:  'bg-forest-50 text-forest-700 border-forest-100',
  GOOD:       'bg-forest-50 text-forest-700 border-forest-100',
  WATCH:      'bg-amber-50 text-amber-700 border-amber-100',
  AT_RISK:    'bg-rust-50 text-rust-700 border-rust-100',
  NEW:        'bg-ink-50 text-ink-500 border-ink-200',
};

export const StatusPill = ({ status }) => (
  <span className={`pill ${statusColors[status] || 'bg-ink-50 text-ink-600 border-ink-200'}`}>
    {status?.replace(/_/g, ' ')}
  </span>
);
