import { useEffect, useState } from 'react';
import { BarChart3, Database, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatNumber, formatDate, formatDateTime, StatusPill } from '../utils.jsx';

// Definitions of all the reports — each maps to a showcase query
const reports = [
  { key: 'understockedProducts',   label: 'Under-stocked Products',           desc: 'CTE + nested aggregate. Products with stock below their category average.', cols: [['product_code','Code'],['product_name','Product'],['category_name','Category'],['current_stock','Stock', 'num'],['category_avg_stock','Cat. Avg', 'num'],['shortfall','Shortfall', 'num']] },
  { key: 'topClientsPerWarehouse', label: 'Top 3 Clients per Warehouse',     desc: 'Window function (RANK). Top revenue clients partitioned by warehouse.', cols: [['warehouse_code','WH'],['warehouse_name','Name'],['company_name','Client'],['client_revenue','Revenue', 'cur'],['rev_rank','#']] },
  { key: 'cleanClients',           label: 'Clients with Zero Alerts',         desc: 'Correlated NOT EXISTS subquery. Clients never had stock issues.', cols: [['client_code','Code'],['company_name','Client'],['onboarded_date','Since', 'date'],['product_count','Products']] },
  { key: 'aboveAvgUtilization',    label: 'Above-Average Utilization',        desc: 'Nested subquery with aggregate comparison.', cols: [['warehouse_code','Code'],['name','Name'],['total_capacity_sqft','Capacity (sqft)', 'num'],['utilization_pct','Utilization %', 'num']] },
  { key: 'skuValueRanking',        label: 'SKU Value Ranking per Warehouse',  desc: 'Window function RANK() partitioned by warehouse.', cols: [['warehouse_code','WH'],['product_name','Product'],['sku_code','SKU'],['quantity_on_hand','Qty', 'num'],['inventory_value','Value', 'cur'],['value_rank','Rank']] },
  { key: 'momGrowth',              label: 'Month-over-Month Growth',          desc: 'CTE + LAG window function showing revenue trend.', cols: [['warehouse_code','WH'],['yr','Year'],['mo','Month'],['current_month_revenue','Revenue', 'cur'],['prev_month_revenue','Prev Month', 'cur'],['mom_growth_pct','Growth %']] },
  { key: 'supplierPerformance',    label: 'Supplier Performance',             desc: 'Multi-join with HAVING clause aggregate filter.', cols: [['supplier_code','Code'],['company_name','Supplier'],['rating','Rating'],['deliveries','Deliveries'],['total_value','Value', 'cur']] },
  { key: 'expiringProducts',       label: 'Products with Expiring SKUs',      desc: 'Nested IN subquery filtering by SKU expiry.', cols: [['product_code','Code'],['product_name','Product'],['owned_by','Client'],['shelf_life_days','Shelf Life (d)']] },
  { key: 'cumulativeRevenue',      label: 'Client Cumulative Revenue',        desc: 'Window function running total (SUM OVER).', cols: [['client_code','Code'],['company_name','Client'],['dispatch_day','Date', 'date'],['daily_revenue','Daily', 'cur'],['cumulative_revenue','Cumulative', 'cur']] },
  { key: 'aboveAvgInvoices',       label: 'Above-Average Invoices',           desc: 'Correlated subquery: invoices above client average.', cols: [['invoice_number','Invoice'],['company_name','Client'],['total_amount','Amount', 'cur'],['client_avg_invoice','Client Avg', 'cur'],['status','Status', 'pill']] },
  { key: 'clientHealth',           label: 'Client Health Snapshot',           desc: 'Multiple CTEs combined for inventory + financial health.', cols: [['company_name','Client'],['product_count','Products'],['inventory_value','Inventory', 'cur'],['total_billed','Billed', 'cur'],['outstanding','Outstanding', 'cur'],['payment_health','Health', 'pill']] },
  { key: 'highestCostSku',         label: 'Highest-Cost SKU per Category',    desc: 'ALL operator with correlated subquery.', cols: [['sku_code','SKU'],['product_name','Product'],['category_name','Category'],['cost_per_unit','Unit Cost', 'cur']] },
];

const renderCell = (val, fmt) => {
  if (val === null || val === undefined) return <span className="text-ink-300">—</span>;
  if (fmt === 'cur') return <span className="font-mono">{formatCurrency(val)}</span>;
  if (fmt === 'num') return <span className="font-mono">{formatNumber(val)}</span>;
  if (fmt === 'date') return <span className="text-xs">{formatDate(val)}</span>;
  if (fmt === 'pill') return <StatusPill status={val} />;
  return val;
};

export default function Reports() {
  const [selected, setSelected] = useState('understockedProducts');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const current = reports.find(r => r.key === selected);

  useEffect(() => {
    setLoading(true);
    api.reports[selected]().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [selected]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Advanced Reports</h1>
        <p className="section-subheading">
          <span className="inline-flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Each report executes an advanced SQL query — nested, correlated, CTE, or window function.
          </span>
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Report selector */}
        <div className="col-span-12 lg:col-span-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 bg-ink-50/50">
              <div className="stat-label">Query Catalog</div>
              <div className="font-display text-lg text-ink-900 mt-0.5">{reports.length} Reports</div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {reports.map(r => (
                <button
                  key={r.key}
                  onClick={() => setSelected(r.key)}
                  className={`w-full text-left px-4 py-3 border-b border-ink-100/60 hover:bg-ink-50/60 transition-colors ${selected === r.key ? 'bg-ink-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${selected === r.key ? 'text-ink-900' : 'text-ink-700'}`}>{r.label}</div>
                      <div className="text-[11px] text-ink-500 mt-0.5 leading-snug">{r.desc}</div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selected === r.key ? 'text-ink-900' : 'text-ink-300'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result area */}
        <div className="col-span-12 lg:col-span-8">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-100">
              <div className="stat-label">Result</div>
              <h2 className="font-display text-xl text-ink-900 mt-0.5">{current?.label}</h2>
              <p className="text-xs text-ink-500 mt-1">{current?.desc}</p>
            </div>
            {loading ? (
              <div className="p-12 text-center text-ink-400">Running query…</div>
            ) : data.length === 0 ? (
              <div className="p-12 text-center text-ink-400">No rows returned</div>
            ) : (
              <div className="overflow-x-auto max-h-[600px]">
                <table className="data-table">
                  <thead className="sticky top-0">
                    <tr>
                      {current.cols.map(([key, label]) => <th key={key}>{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i}>
                        {current.cols.map(([key, , fmt]) => (
                          <td key={key} className={fmt === 'cur' || fmt === 'num' ? 'text-right' : ''}>
                            {renderCell(row[key], fmt)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-5 py-2 border-t border-ink-100 bg-ink-50/40 text-[11px] text-ink-500 font-mono flex justify-between">
              <span>{data.length} rows returned</span>
              <span>SELECT … FROM …</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
