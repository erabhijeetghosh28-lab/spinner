'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export function UsageStats({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/admin/usage?tenantId=${tenantId}`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tenantId]);
  
  if (isLoading) {
    return <div className="animate-pulse bg-slate-800 h-32 rounded-xl"></div>;
  }
  
  const usagePercent = (data?.activeCampaigns / data?.plan.campaignsPerMonth) * 100;
  const isAtLimit = data?.activeCampaigns >= data?.plan.campaignsPerMonth;
  
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
      <h3 className="font-bold text-lg mb-4">Campaign Usage</h3>
      
      <div className="space-y-4">
        {/* Active Campaigns */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-400">Active Campaigns</span>
            <span className="font-bold">
              {data?.activeCampaigns}/{data?.plan.campaignsPerMonth}
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Monthly Created */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-400">Created This Month</span>
            <span className="font-bold">
              {data?.monthlyCreated}/{data?.plan.campaignsPerMonth}
            </span>
          </div>
        </div>
        
        {/* Upgrade Prompt */}
        {isAtLimit && (
          <div className="bg-orange-500/10 border border-orange-500 p-4 rounded-lg mt-4">
            <p className="text-orange-400 text-sm">
              ⚠️ Campaign limit reached.
              <a 
                href="/admin/billing/upgrade" 
                className="underline ml-1 font-bold"
              >
                Upgrade to create more
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
