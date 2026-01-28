'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';

/**
 * FailedPaymentsList Component
 * 
 * Displays tenants with payment issues (PAST_DUE status).
 * 
 * Features:
 * - Fetches failed payments from billing dashboard API
 * - Displays tenant name, subscription status, plan details
 * - Shows subscription end date if available
 * - Highlights urgent payment issues
 * - Visual indicators for severity
 * 
 * Requirements: 5.5
 */

interface TenantWithPaymentIssue {
  id: string;
  name: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  planName: string;
  planPrice: number;
}

export function FailedPaymentsList() {
  const [failedPayments, setFailedPayments] = useState<TenantWithPaymentIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFailedPayments();
  }, []);

  const fetchFailedPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/super/billing/dashboard');
      setFailedPayments(response.data.failedPayments || []);
    } catch (err: any) {
      console.error('Error fetching failed payments:', err);
      setError(err.response?.data?.error?.message || 'Failed to load payment issues');
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

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getDaysOverdue = (subscriptionEnd: string | null): number | null => {
    if (!subscriptionEnd) return null;
    const endDate = new Date(subscriptionEnd);
    const now = new Date();
    const diffTime = now.getTime() - endDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="space-y-3">
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
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-bold text-white">Failed Payments</h3>
          {failedPayments.length > 0 && (
            <span className="flex items-center justify-center w-6 h-6 bg-red-500/20 text-red-500 text-xs font-bold rounded-full">
              {failedPayments.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchFailedPayments}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {failedPayments.length > 0 ? (
        <div className="space-y-3">
          {failedPayments.map((payment) => {
            const daysOverdue = getDaysOverdue(payment.subscriptionEnd);
            const isCritical = daysOverdue !== null && daysOverdue > 7;
            
            return (
              <div
                key={payment.id}
                className={`border rounded-xl p-4 transition-all duration-200 ${
                  isCritical
                    ? 'bg-red-500/10 border-red-500/50'
                    : 'bg-orange-500/10 border-orange-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-white">{payment.name}</h4>
                      <span className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${
                        isCritical
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{isCritical ? 'Critical' : 'Past Due'}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <span className="ml-2 font-semibold text-orange-500">{payment.subscriptionStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Plan:</span>
                        <span className="ml-2 font-semibold text-white">{payment.planName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Subscription End:</span>
                        <span className="ml-2 font-semibold text-slate-400">{formatDate(payment.subscriptionEnd)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Amount:</span>
                        <span className="ml-2 font-semibold text-emerald-500">{formatCurrency(payment.planPrice)}</span>
                      </div>
                    </div>

                    {daysOverdue !== null && daysOverdue > 0 && (
                      <div className={`mt-3 flex items-center space-x-2 text-sm font-semibold ${
                        isCritical ? 'text-red-500' : 'text-orange-500'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue</span>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isCritical
                        ? 'bg-red-500/20'
                        : 'bg-orange-500/20'
                    }`}>
                      <svg className={`w-6 h-6 ${isCritical ? 'text-red-500' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
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
          <p className="font-semibold">No payment issues</p>
          <p className="text-sm mt-1">All subscriptions are in good standing</p>
        </div>
      )}
    </div>
  );
}
