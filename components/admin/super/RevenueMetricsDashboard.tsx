'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';

/**
 * RevenueMetricsDashboard Component
 * 
 * Displays comprehensive revenue and billing metrics for Super Admins.
 * 
 * Features:
 * - MRR (Monthly Recurring Revenue) with currency formatting
 * - New revenue and churned revenue
 * - Revenue breakdown by subscription plan
 * - Active vs total tenant counts
 * - Visual indicators and formatting
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
 */

interface RevenueMetrics {
  mrr: number;
  newRevenue: number;
  churnedRevenue: number;
  revenueByPlan: Record<string, number>;
  activeTenantsCount: number;
  totalTenantsCount: number;
}

export function RevenueMetricsDashboard() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/super/billing/dashboard');
      setMetrics(response.data);
    } catch (err: any) {
      console.error('Error fetching revenue metrics:', err);
      setError(err.response?.data?.error?.message || 'Failed to load revenue metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amountInPaise: number): string => {
    const rupees = amountInPaise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-slate-800 rounded"></div>
            <div className="h-32 bg-slate-800 rounded"></div>
            <div className="h-32 bg-slate-800 rounded"></div>
          </div>
          <div className="h-48 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 text-red-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const netRevenue = metrics.newRevenue - metrics.churnedRevenue;
  const activePercentage = metrics.totalTenantsCount > 0
    ? Math.round((metrics.activeTenantsCount / metrics.totalTenantsCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Revenue Dashboard</h2>
        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MRR Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">MRR</span>
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{formatCurrency(metrics.mrr)}</div>
          <p className="text-sm text-slate-400">Monthly Recurring Revenue</p>
        </div>

        {/* New Revenue Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">New Revenue</span>
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{formatCurrency(metrics.newRevenue)}</div>
          <p className="text-sm text-slate-400">From new subscriptions</p>
        </div>

        {/* Churned Revenue Card */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Churned</span>
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{formatCurrency(metrics.churnedRevenue)}</div>
          <p className="text-sm text-slate-400">From cancellations</p>
        </div>
      </div>

      {/* Net Revenue & Tenant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Net Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Net Revenue This Month</h3>
          <div className={`text-4xl font-bold mb-2 ${netRevenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {netRevenue >= 0 ? '+' : ''}{formatCurrency(netRevenue)}
          </div>
          <p className="text-sm text-slate-400">
            {netRevenue >= 0 ? 'Revenue growth' : 'Revenue decline'} from new subscriptions and cancellations
          </p>
        </div>

        {/* Tenant Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Tenant Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Tenants</span>
              <span className="text-2xl font-bold text-white">{metrics.activeTenantsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Tenants</span>
              <span className="text-2xl font-bold text-slate-500">{metrics.totalTenantsCount}</span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-400">Active Rate</span>
                <span className="text-lg font-bold text-emerald-500">{activePercentage}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${activePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Revenue by Subscription Plan</h3>
        {Object.keys(metrics.revenueByPlan).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(metrics.revenueByPlan)
              .sort(([, a], [, b]) => b - a)
              .map(([planName, revenue]) => {
                const percentage = metrics.mrr > 0 ? Math.round((revenue / metrics.mrr) * 100) : 0;
                return (
                  <div key={planName} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{planName}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-slate-400">{percentage}%</span>
                        <span className="text-lg font-bold text-white">{formatCurrency(revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No revenue data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
