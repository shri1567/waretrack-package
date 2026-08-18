import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Warehouse, Users, Package, Truck, IndianRupee, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatNumber, formatDateTime } from '../utils.jsx';

const chartColors = ['#1c1917', '#16a34a', '#d97706', '#dc2626', '#78716c', '#0c0a09'];

function KPICard({ label, value, icon: Icon, accent = 'ink', delta }) {
  const accentClass = {
    ink:    'bg-ink-900 text-cream-50',
    forest: 'bg-forest-600 text-cream-50',
    amber:  'bg-amber-500 text-cream-50',
    rust:   'bg-rust-600 text-cream-50',
  }[accent];

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="mt-2 text-2xl font-display text-ink-900 leading-none">{value}</div>
          {delta !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${delta >= 0 ? 'text-forest-700' : 'text-rust-700'}`}>
              {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(delta)}% vs last month
            </div>
          )}
        </div>
        <div className={`w-9 h-9 rounded ${accentClass} flex items-center justify-center`}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [categoryDist, setCategoryDist] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.dashboardSummary(),
      api.warehouseUtilization(),
      api.monthlyRevenue(),
      api.topClients(),
      api.categoryDistribution(),
      api.recentActivity(),
    ]).then(([s, u, r, t, c, a]) => {
      setSummary(s.data);
      setUtilization(u.data);
      setRevenue(r.data);
      setTopClients(t.data);
      setCategoryDist(c.data);
      setActivity(a.data);
      setLoading(false);
    }).catch((err) => {
      console.error('Dashboard load error:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-400">
        <Activity className="w-5 h-5 animate-pulse mr-2" /> Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-heading">Operations Dashboard</h1>
          <p className="section-subheading">
            Real-time inventory and logistics overview across {summary?.warehouse_count} warehouses.
          </p>
        </div>
        <div className="text-right text-xs text-ink-400 font-mono">
          <div>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div className="text-ink-300 mt-0.5">Last refresh: just now</div>
        </div>
      </div>

      {/* KPI ROW 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Warehouses"        value={summary?.warehouse_count}                       icon={Warehouse} accent="ink" />
        <KPICard label="Active Clients"    value={summary?.active_clients}                        icon={Users}     accent="ink" />
        <KPICard label="Active SKUs"       value={formatNumber(summary?.total_skus)}              icon={Package}   accent="ink" />
        <KPICard label="Shipments / Month" value={summary?.shipments_this_month}                  icon={Truck}     accent="ink" />
      </div>

      {/* KPI ROW 2 - financial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KPICard label="Inventory Value"    value={formatCurrency(summary?.total_inventory_value)} icon={IndianRupee} accent="forest" />
        <KPICard label="Outstanding A/R"    value={formatCurrency(summary?.total_outstanding)}     icon={IndianRupee} accent="amber" />
        <KPICard label="Critical Alerts"    value={`${summary?.critical_alerts} / ${summary?.open_alerts}`} icon={AlertTriangle} accent={summary?.critical_alerts > 0 ? 'rust' : 'ink'} />
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="stat-label">Monthly Revenue</div>
              <div className="font-display text-xl text-ink-900 mt-0.5">Outbound Shipment Value</div>
            </div>
            <TrendingUp className="w-4 h-4 text-forest-600" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e7e5e4" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="month" stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#78716c" fontSize={11} tickLine={false} axisLine={false}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#0c0a09', border: 'none', borderRadius: 6, color: '#fdfaf3', fontSize: 12 }}
                formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2}
                dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="card p-5">
          <div className="stat-label">Stock by Category</div>
          <div className="font-display text-xl text-ink-900 mt-0.5 mb-4">Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryDist} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}
                   stroke="#fff" strokeWidth={2}>
                {categoryDist.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0c0a09', border: 'none', borderRadius: 6, color: '#fdfaf3', fontSize: 12 }}
                formatter={(v) => `${formatNumber(v)} units`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-ink-400 space-y-1 mt-2">
            {categoryDist.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm" style={{ background: chartColors[i % chartColors.length] }}></span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-mono text-ink-500">{formatNumber(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WAREHOUSE UTILIZATION + ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="stat-label">Warehouse Capacity</div>
          <div className="font-display text-xl text-ink-900 mt-0.5 mb-4">Utilization by Location</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={utilization} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
              <CartesianGrid stroke="#e7e5e4" strokeDasharray="0" horizontal={false} />
              <XAxis type="number" stroke="#78716c" fontSize={11} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${v}%`} domain={[0, 'dataMax + 10']} />
              <YAxis type="category" dataKey="warehouse_code" stroke="#78716c" fontSize={11}
                tickLine={false} axisLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: '#0c0a09', border: 'none', borderRadius: 6, color: '#fdfaf3', fontSize: 12 }}
                formatter={(v, n) => n === 'utilization_pct' ? `${v}%` : v} />
              <Bar dataKey="utilization_pct" fill="#1c1917" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="stat-label">Recent Activity</div>
          <div className="font-display text-xl text-ink-900 mt-0.5 mb-4">Last Shipments</div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className={`w-7 h-7 rounded shrink-0 flex items-center justify-center ${
                  a.type === 'INBOUND' ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {a.type === 'INBOUND' ? '↓' : '↑'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-ink-900 truncate">{a.ref}</div>
                  <div className="text-xs text-ink-500 truncate">{a.party} · {a.warehouse_code}</div>
                  <div className="text-[10px] text-ink-400 mt-0.5">{formatDateTime(a.event_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP CLIENTS */}
      <div className="card p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="stat-label">Top Clients</div>
            <div className="font-display text-xl text-ink-900 mt-0.5">By Outbound Revenue</div>
          </div>
        </div>
        <div className="space-y-3">
          {topClients.map((c, i) => {
            const max = topClients[0]?.revenue || 1;
            const pct = (c.revenue / max) * 100;
            return (
              <div key={i}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-800 font-medium">{c.company_name}</span>
                  <span className="font-mono text-ink-900">{formatCurrency(c.revenue)}</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-ink-50 rounded-full overflow-hidden">
                  <div className="h-full bg-ink-900 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
