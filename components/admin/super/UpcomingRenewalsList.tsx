'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';

/**
 * UpcomingRenewalsList Component
 * 
 * Displays tenants with upcoming subscription renewals.
 * 
 * Features:
 * - Fetches renewals from API with configurable days parameter
 * - Displays tenant name, renewal date, days until renewal
 * - Shows plan name and price
 * - Sorts by renewal date (soonest first)
 * - Visual indicators for urgency (< 3 days)
 * 
 * Requirements: 5.4
 */

interface TenantWithRenewal {
  id: string;
  name: string;
  subscriptionEnd: string;
  daysUntilRenewal: number;
  planName: string;
  planPrice: number;
}

interface UpcomingRenewalsListProps {
  days?: number;
}

export function UpcomingRenewalsList({ days = 7 }: UpcomingRenewalsListProps) {
  const [renewals, setRenewals] = useState<TenantWithRenewal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRenewals();
  }, [days]);

  const fetchRenewals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`/api/admin/super/billing/renewals?days=${days}`);
      setRenewals(response.data);
    } catch (err: any) {
      console.error('Error fetching upcoming renewals:', err);
      setError(err.response?.data?.error?.message || 'Failed to load upcoming renewals');
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-slate-800 rounded"></div>
            <div className="h-16 bg-slate-800 rounded"></div>
            <div className="h-16 bg-slate-800 rounded"></div>
          </div>
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Upcoming Renewals ({days} days)</h3>
        <button
          onClick={fetchRenewals}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {renewals.length > 0 ? (
        <div className="space-y-3">
          {renewals.map((renewal) => {
            const isUrgent = renewal.daysUntilRenewal <= 3;
            
            return (
              <div
                key={renewal.id}
                className={`border rounded-xl p-4 transition-all duration-200 ${
                  isUrgent
                    ? 'bg-orange-500/10 border-orange-500/50'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-white">{renewal.name}</h4>
                      {isUrgent && (
                        <span className="flex items-center space-x-1 bg-orange-500/20 text-orange-500 text-xs font-bold px-2 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Urgent</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(renewal.subscriptionEnd)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{renewal.planName}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold mb-1 ${isUrgent ? 'text-orange-500' : 'text-white'}`}>
                      {renewal.daysUntilRenewal}
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      {renewal.daysUntilRenewal === 1 ? 'day' : 'days'}
                    </div>
                    <div className="text-sm font-semibold text-emerald-500">
                      {formatCurrency(renewal.planPrice)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold">No upcoming renewals</p>
          <p className="text-sm mt-1">All subscriptions are current</p>
        </div>
      )}
    </div>
  );
}
