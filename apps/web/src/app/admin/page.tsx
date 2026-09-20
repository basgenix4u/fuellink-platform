// src/app/admin/page.tsx

"use client";

import { 
  Building2, Users, AlertTriangle, TrendingUp, 
  Droplet, Activity, ArrowUpRight, ArrowDownRight, CheckCircle2 
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/shared/Badge";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "neutral" | "down";
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, change, trend, icon: Icon, color }: StatCardProps) => (
  <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
    <div className="flex items-center justify-between">
      <div className={`rounded-xl p-3 ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
    </div>
    {/* Decorative chart line */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
  </div>
);

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regulatory Oversight</h1>
        <p className="text-slate-500 mt-1">Real-time market monitoring and compliance status.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Market Volume" 
          value="145.2M Litres" 
          change="12%" 
          trend="up" 
          icon={Droplet} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Platform Revenue" 
          value="₦84.5 Million" 
          change="8.2%" 
          trend="up" 
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Active Depots" 
          value="127" 
          change="3 Pending" 
          trend="neutral" 
          icon={Building2} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Compliance Issues" 
          value="12" 
          change="2 Critical" 
          trend="down" 
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Critical Alerts - Priority Feed */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Live Regulatory Feed
            </h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { title: "Low Stock Critical", desc: "Matrix Energy (Warri) PMS tank below 5%", time: "10m ago", type: "critical" },
              { title: "New Depot Registration", desc: "Rainoil Ltd submitted license docs for verification", time: "32m ago", type: "info" },
              { title: "Price Deviation", desc: "MRS Oil set PMS price 15% above market average", time: "1h ago", type: "warning" },
              { title: "Large Transaction", desc: "1.5M Litres AGO moved from Pinnacle to Total", time: "2h ago", type: "success" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className={`mt-1 h-2 w-2 rounded-full ${
                  item.type === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                  item.type === 'warning' ? 'bg-amber-500' :
                  item.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Verifications - "To Do" List */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <h3 className="font-bold text-slate-900">Pending Actions</h3>
            <Badge variant="warning">5 New</Badge>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Depot Onboarding</p>
                  <p className="text-xs text-slate-500">2 applications waiting</p>
                </div>
              </div>
              <button className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Review</button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Marketer KYC</p>
                  <p className="text-xs text-slate-500">3 docs pending</p>
                </div>
              </div>
              <button className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Review</button>
            </div>

            <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
              <p className="text-sm font-medium text-indigo-900">System Status</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-indigo-700">
                <CheckCircle2 className="h-4 w-4" /> All services operational
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}