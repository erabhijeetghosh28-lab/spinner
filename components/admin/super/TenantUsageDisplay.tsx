'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';

/**
 * TenantUsageDisplay Component
 * 
 * Displays comprehensive usage statistics for a tenant including:
 * - Spins used vs limit with percentage and progress bar
 * - Vouchers used vs limit with percentage and progress bar
 * - Days until monthly reset
 * - Usage trend with up/down indicators
 * - Warning indicators when usage >= 80%
 * - Active overrides with bonus amounts and reasons
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.7
 */

interface UsageData {
  currentMonth: {
    spinsUsed: number;
    spinsLimit: number;
    spinsPercentage: number;
    vouchersUsed: number;
    vouchersLimit: number;
    vouchersPercentage: number;
    daysUntilReset: number;
  };
  previousMonth: {
    spinsUsed: number;
    vouchersUsed: number;
  };
  trend: {
    spinsChange: number;
    vouchersChange: number;
  };
}

interface Override {
  id: string;
  bonusSpins: number;
  bonusVouchers: number;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
  grantedByAdmin: {
    email: string;
  };
}

interface TenantUsageDisplayProps {
  tenantId: string;
}

export function TenantUsageDisplay({ tenantId }: TenantUsageDisplayProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
    fetchOverrides();
  }, [tenantId]);

  const fetchUsageData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`/api/admin/super/tenants/${tenantId}/usage`);
      setUsageData(response.data);
    } catch (err: any) {
      console.error('Error fetching usage data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOverrides = async () => {
    try {
      // Fetch active overrides from the database
      // Note: We'll need to add a GET endpoint or include this in the usage endpoint
      // For now, we'll make a separate call
      const response = await axios.get(`/api/admin/super/tenants/${tenantId}/overrides`);
      setOverrides(response.data.overrides || []);
    } catch (err) {
      console.error('Error fetching overrides:', err);
      // Don't set error state for overrides, just log it
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-24 bg-slate-800 rounded"></div>
          <div className="h-24 bg-slate-800 rounded"></div>
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

  if (!usageData) {
    return null;
  }

  const { currentMonth, trend } = usageData;

  // Check if limits are unlimited
  const spinsUnlimited = currentMonth.spinsLimit === Infinity || currentMonth.spinsLimit > 999999999;
  const vouchersUnlimited = currentMonth.vouchersLimit === Infinity || currentMonth.vouchersLimit > 999999999;

  // Check if usage is at warning threshold (>= 80%) - only for limited plans
  const spinsWarning = !spinsUnlimited && currentMonth.spinsPercentage >= 80;
  const vouchersWarning = !vouchersUnlimited && currentMonth.vouchersPercentage >= 80;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Usage Statistics</h3>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Resets in {currentMonth.daysUntilReset} {currentMonth.daysUntilReset === 1 ? 'day' : 'days'}</span>
        </div>
      </div>

      {/* Spins Usage */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Spins</span>
            {spinsWarning && (
              <span className="flex items-center space-x-1 text-xs font-bold text-orange-500 bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Warning</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-white">
              {currentMonth.spinsUsed.toLocaleString()}
              <span className="text-slate-500 text-lg">
                {' / '}
                {spinsUnlimited ? (
                  <span className="text-emerald-500">∞ Unlimited</span>
                ) : (
                  currentMonth.spinsLimit.toLocaleString()
                )}
              </span>
            </span>
            {!spinsUnlimited && <TrendIndicator change={trend.spinsChange} />}
          </div>
        </div>
        
        {!spinsUnlimited && (
          <div className="relative">
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  spinsWarning 
                    ? currentMonth.spinsPercentage >= 100 
                      ? 'bg-red-500' 
                      : 'bg-orange-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(currentMonth.spinsPercentage, 100)}%` }}
              />
            </div>
            <div className="absolute -top-1 right-0 text-xs font-bold text-slate-400">
              {currentMonth.spinsPercentage}%
            </div>
          </div>
        )}
      </div>

      {/* Vouchers Usage */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Vouchers</span>
            {vouchersWarning && (
              <span className="flex items-center space-x-1 text-xs font-bold text-orange-500 bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Warning</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-white">
              {currentMonth.vouchersUsed.toLocaleString()}
              <span className="text-slate-500 text-lg">
                {' / '}
                {vouchersUnlimited ? (
                  <span className="text-emerald-500">∞ Unlimited</span>
                ) : (
                  currentMonth.vouchersLimit.toLocaleString()
                )}
              </span>
            </span>
            {!vouchersUnlimited && <TrendIndicator change={trend.vouchersChange} />}
          </div>
        </div>
        
        {!vouchersUnlimited && (
          <div className="relative">
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  vouchersWarning 
                    ? currentMonth.vouchersPercentage >= 100 
                      ? 'bg-red-500' 
                      : 'bg-orange-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(currentMonth.vouchersPercentage, 100)}%` }}
              />
            </div>
            <div className="absolute -top-1 right-0 text-xs font-bold text-slate-400">
              {currentMonth.vouchersPercentage}%
            </div>
          </div>
        )}
      </div>

      {/* Active Overrides */}
      {overrides.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Active Overrides ({overrides.length})
          </h4>
          <div className="space-y-2">
            {overrides.map((override) => (
              <div 
                key={override.id} 
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {override.bonusSpins > 0 && (
                      <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded">
                        +{override.bonusSpins.toLocaleString()} spins
                      </span>
                    )}
                    {override.bonusVouchers > 0 && (
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">
                        +{override.bonusVouchers.toLocaleString()} vouchers
                      </span>
                    )}
                  </div>
                  {override.expiresAt && (
                    <span className="text-xs text-slate-500">
                      Expires {new Date(override.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Reason:</span> {override.reason}
                </p>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Granted by {override.grantedByAdmin.email}</span>
                  <span>{new Date(override.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TrendIndicator Component
 * 
 * Displays an up/down arrow with percentage change
 */
function TrendIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="flex items-center space-x-1 text-xs font-bold text-slate-500">
        <span>—</span>
        <span>0%</span>
      </span>
    );
  }

  const isIncrease = change > 0;
  const color = isIncrease ? 'text-red-500' : 'text-green-500';

  return (
    <span className={`flex items-center space-x-1 text-xs font-bold ${color}`}>
      {isIncrease ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      <span>{Math.abs(change)}%</span>
    </span>
  );
}
