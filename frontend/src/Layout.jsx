import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Warehouse, Package, Users, Truck,
  FileText, AlertTriangle, BarChart3, Boxes, Factory
} from 'lucide-react';

const navItems = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
  { to: '/inventory',  label: 'Inventory',  icon: Boxes },
  { to: '/shipments',  label: 'Shipments',  icon: Truck },
  { to: '/clients',    label: 'Clients',    icon: Users },
  { to: '/suppliers',  label: 'Suppliers',  icon: Factory },
  { to: '/invoices',   label: 'Invoices',   icon: FileText },
  { to: '/alerts',     label: 'Alerts',     icon: AlertTriangle },
  { to: '/reports',    label: 'Reports',    icon: BarChart3 },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR */}
      <aside className="w-60 shrink-0 bg-ink-900 text-ink-100 flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-ink-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cream-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-ink-900" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-xl text-cream-50 leading-none">WareTrack</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 mt-1">Logistics OS</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                   ${isActive
                     ? 'bg-ink-700/50 text-cream-50 font-medium'
                     : 'text-ink-300 hover:text-cream-50 hover:bg-ink-800/60'}`
                }
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-ink-700/50 text-[10px] text-ink-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse"></span>
            <span>System Operational</span>
          </div>
          <div className="mt-2 font-mono text-ink-500">v1.0.0 · BITS Pilani</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1400px] mx-auto px-8 py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
