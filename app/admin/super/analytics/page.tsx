'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlatformAnalyticsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [tenantComparison, setTenantComparison] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem('super-admin-token');
    if (!token) {
      router.push('/admin/super');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchAnalytics();
  }, [mounted]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, comparisonRes] = await Promise.all([
        axios.get('/api/admin/super/analytics/platform'),
        axios.get('/api/admin/super/analytics/tenants/comparison?limit=20')
      ]);
      
      setAnalytics(analyticsRes.data || {});
      setTenantComparison(comparisonRes.data?.tenants || []);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      // Set empty defaults to prevent undefined errors
      setAnalytics({});
      setTenantComparison([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <SuperAdminNav />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Platform Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">🎯</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Total Spins</div>
            <div className="text-3xl font-bold text-amber-500">
              {analytics.totalSpins?.toLocaleString() || 0}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">🎟️</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Total Vouchers</div>
            <div className="text-3xl font-bold text-green-500">
              {analytics.totalVouchers?.toLocaleString() || 0}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">📊</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Avg Redemption Rate</div>
            <div className="text-3xl font-bold text-blue-500">
              {analytics.avgRedemptionRate?.toFixed(1) || 0}%
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">✅</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Active Tenants</div>
            <div className="text-3xl font-bold text-purple-500">
              {analytics.activePercentage?.toFixed(1) || 0}%
            </div>
          </div>
        </div>

        {/* Tenant Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">📈</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">New Tenants This Month</div>
            <div className="text-3xl font-bold text-green-500">
              {analytics.newTenantsThisMonth || 0}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">📉</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Churned Tenants This Month</div>
            <div className="text-3xl font-bold text-red-500">
              {analytics.churnedTenantsThisMonth || 0}
            </div>
          </div>
        </div>

        {/* Growth Trends */}
        {analytics.growthTrends && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Growth Trends (Month-over-Month)</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <div className="text-slate-400 text-xs font-medium uppercase mb-2">Spins Growth</div>
                <div className={`text-2xl font-bold ${analytics.growthTrends.spinsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.growthTrends.spinsGrowth >= 0 ? '+' : ''}{analytics.growthTrends.spinsGrowth?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium uppercase mb-2">Vouchers Growth</div>
                <div className={`text-2xl font-bold ${analytics.growthTrends.vouchersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.growthTrends.vouchersGrowth >= 0 ? '+' : ''}{analytics.growthTrends.vouchersGrowth?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium uppercase mb-2">Tenants Growth</div>
                <div className={`text-2xl font-bold ${analytics.growthTrends.tenantsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.growthTrends.tenantsGrowth >= 0 ? '+' : ''}{analytics.growthTrends.tenantsGrowth?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium uppercase mb-2">Revenue Growth</div>
                <div className={`text-2xl font-bold ${analytics.growthTrends.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.growthTrends.revenueGrowth >= 0 ? '+' : ''}{analytics.growthTrends.revenueGrowth?.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Performers */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Top 10 Tenants</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-4 font-bold">Rank</th>
                  <th className="pb-4 font-bold">Tenant</th>
                  <th className="pb-4 font-bold">Spins</th>
                  <th className="pb-4 font-bold">Vouchers</th>
                  <th className="pb-4 font-bold">Redemption Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(analytics?.topTenants || []).map((tenant: any, index: number) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30">
                    <td className="py-4">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                    </td>
                    <td className="py-4 font-bold">{tenant.name}</td>
                    <td className="py-4">{tenant.spins?.toLocaleString() || 0}</td>
                    <td className="py-4">{tenant.vouchers?.toLocaleString() || 0}</td>
                    <td className="py-4">{tenant.redemptionRate?.toFixed(1) || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Performers */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Bottom 10 Tenants (Need Attention)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-4 font-bold">Tenant</th>
                  <th className="pb-4 font-bold">Spins</th>
                  <th className="pb-4 font-bold">Vouchers</th>
                  <th className="pb-4 font-bold">Redemption Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(analytics?.bottomTenants || []).map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30">
                    <td className="py-4 font-bold">{tenant.name}</td>
                    <td className="py-4 text-slate-400">{tenant.spins?.toLocaleString() || 0}</td>
                    <td className="py-4 text-slate-400">{tenant.vouchers?.toLocaleString() || 0}</td>
                    <td className="py-4 text-slate-400">{tenant.redemptionRate?.toFixed(1) || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Tenants Comparison */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">All Tenants Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-4 font-bold">Rank</th>
                  <th className="pb-4 font-bold">Tenant</th>
                  <th className="pb-4 font-bold">Spins</th>
                  <th className="pb-4 font-bold">Vouchers</th>
                  <th className="pb-4 font-bold">Redemption Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(tenantComparison || []).map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30">
                    <td className="py-4">#{tenant.rank}</td>
                    <td className="py-4 font-bold">{tenant.name}</td>
                    <td className="py-4">{tenant.spins?.toLocaleString() || 0}</td>
                    <td className="py-4">{tenant.vouchers?.toLocaleString() || 0}</td>
                    <td className="py-4">{tenant.redemptionRate?.toFixed(1) || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
