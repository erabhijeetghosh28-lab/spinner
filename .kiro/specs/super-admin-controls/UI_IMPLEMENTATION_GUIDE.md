# Super Admin UI Implementation Guide

## Overview

This guide provides complete specifications for manually implementing the 5 Super Admin UI pages from Task 15. All backend APIs are already implemented and ready to use. This guide follows the existing UI patterns from `app/admin/super/dashboard/page.tsx`.

## Design System

### Color Palette
- Background: `bg-slate-950` (main), `bg-slate-900` (cards), `bg-slate-800` (inputs)
- Borders: `border-slate-800`, `border-slate-700`
- Text: `text-white` (primary), `text-slate-400` (secondary), `text-slate-500` (labels)
- Accent: `text-amber-500`, `bg-amber-500` (buttons)
- Success: `text-green-500`, `bg-green-500/10`
- Error: `text-red-500`, `bg-red-500/10`

### Typography
- Headers: `text-2xl font-bold text-amber-500`
- Subheaders: `text-xl font-bold`
- Labels: `text-xs font-semibold text-slate-500 uppercase`
- Body: `text-sm text-slate-400`

### Components
- Cards: `bg-slate-900 border border-slate-800 rounded-2xl p-6`
- Buttons: `bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold`
- Inputs: `w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500`
- Modals: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`
- Tables: `w-full text-left` with `divide-y divide-slate-800`

---

## Task 15.1: Global Voucher View Page

### File Location
`app/admin/super/vouchers/page.tsx`

### Page Structure

```typescript
'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function GlobalVouchersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  
  // Filters
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Tenants for dropdown
  const [tenants, setTenants] = useState<any[]>([]);
  
  // Void modal
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidingVoucher, setVoidingVoucher] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('super-admin-token');
    if (!token) {
      router.push('/admin/super');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchTenants();
    fetchVouchers();
  }, [page, search, tenantFilter, statusFilter, startDate, endDate]);

  const fetchTenants = async () => {
    try {
      const res = await axios.get('/api/admin/super/tenants');
      setTenants(res.data.tenants);
    } catch (err) {
      console.error('Failed to fetch tenants');
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(tenantFilter && { tenantId: tenantFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const res = await axios.get(`/api/admin/super/vouchers?${params}`);
      setVouchers(res.data.vouchers);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!voidingVoucher || !voidReason.trim()) return;
    
    try {
      await axios.put(`/api/admin/super/vouchers/${voidingVoucher.id}/void`, {
        reason: voidReason
      });
      setShowVoidModal(false);
      setVoidingVoucher(null);
      setVoidReason('');
      fetchVouchers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to void voucher');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(tenantFilter && { tenantId: tenantFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const res = await axios.get(`/api/admin/super/vouchers/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vouchers-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export vouchers');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header - same as existing dashboard */}
      {/* ... */}
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Global Voucher Management</h2>
            <button
              onClick={handleExport}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold"
            >
              📥 Export to CSV
            </button>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search code or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
            
            <select
              value={tenantFilter}
              onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="">All Tenants</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
            </select>
            
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
            
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="pb-4 font-bold">Code</th>
                      <th className="pb-4 font-bold">Tenant</th>
                      <th className="pb-4 font-bold">Customer</th>
                      <th className="pb-4 font-bold">Prize</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold">Created</th>
                      <th className="pb-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="hover:bg-slate-800/30">
                        <td className="py-4 font-mono text-sm">{voucher.code}</td>
                        <td className="py-4">{voucher.campaign?.tenant?.name || 'N/A'}</td>
                        <td className="py-4">{voucher.user?.phone || 'N/A'}</td>
                        <td className="py-4">{voucher.prize?.name || 'N/A'}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            voucher.redeemedAt ? 'bg-green-500/10 text-green-500' :
                            new Date(voucher.expiresAt) < new Date() ? 'bg-red-500/10 text-red-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {voucher.redeemedAt ? 'Redeemed' :
                             new Date(voucher.expiresAt) < new Date() ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-slate-400">
                          {new Date(voucher.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          {!voucher.redeemedAt && new Date(voucher.expiresAt) >= new Date() && (
                            <button
                              onClick={() => {
                                setVoidingVoucher(voucher);
                                setShowVoidModal(true);
                              }}
                              className="text-red-500 hover:text-red-400 text-sm font-bold"
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-slate-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Void Modal */}
      {showVoidModal && voidingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Void Voucher</h2>
            <p className="text-slate-300 mb-4">
              Void voucher <span className="font-mono text-white">{voidingVoucher.code}</span>?
            </p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-4"
              rows={3}
              required
            />
            <div className="flex space-x-4">
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
              >
                Void Voucher
              </button>
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setVoidingVoucher(null);
                  setVoidReason('');
                }}
                className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### API Endpoints Used
- `GET /api/admin/super/vouchers` - List vouchers with filters
- `PUT /api/admin/super/vouchers/:id/void` - Void a voucher
- `GET /api/admin/super/vouchers/export` - Export to CSV
- `GET /api/admin/super/tenants` - Get tenant list for dropdown

### Key Features
1. Search by voucher code or customer phone
2. Filter by tenant, status, date range
3. Paginated table with 50 items per page
4. Void button for active vouchers with reason modal
5. Export to CSV with current filters applied
6. Status badges (Active/Redeemed/Expired)

---

## Task 15.2: Global Campaign View Page

### File Location
`app/admin/super/campaigns/page.tsx`

### Page Structure

```typescript
'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function GlobalCampaignsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  
  // Filters
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Tenants for dropdown
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('super-admin-token');
    if (!token) {
      router.push('/admin/super');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchTenants();
    fetchCampaigns();
  }, [page, search, tenantFilter, statusFilter]);

  const fetchTenants = async () => {
    try {
      const res = await axios.get('/api/admin/super/tenants');
      setTenants(res.data.tenants);
    } catch (err) {
      console.error('Failed to fetch tenants');
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(tenantFilter && { tenantId: tenantFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      
      const res = await axios.get(`/api/admin/super/campaigns?${params}`);
      setCampaigns(res.data.campaigns);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (campaignId: string) => {
    if (!confirm('Pause this campaign?')) return;
    
    try {
      await axios.put(`/api/admin/super/campaigns/${campaignId}/pause`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to pause campaign');
    }
  };

  const handleUnpause = async (campaignId: string) => {
    if (!confirm('Unpause this campaign?')) return;
    
    try {
      await axios.put(`/api/admin/super/campaigns/${campaignId}/unpause`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unpause campaign');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header - same as existing dashboard */}
      {/* ... */}
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Global Campaign Management</h2>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search campaign name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
            
            <select
              value={tenantFilter}
              onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="">All Tenants</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="pb-4 font-bold">Campaign</th>
                      <th className="pb-4 font-bold">Tenant</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold">Dates</th>
                      <th className="pb-4 font-bold">Spins</th>
                      <th className="pb-4 font-bold">Vouchers</th>
                      <th className="pb-4 font-bold">Redemption</th>
                      <th className="pb-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-slate-800/30">
                        <td className="py-4 font-bold">{campaign.name}</td>
                        <td className="py-4">{campaign.tenant?.name || 'N/A'}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            campaign.isArchived ? 'bg-slate-500/10 text-slate-500' :
                            campaign.isActive ? 'bg-green-500/10 text-green-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {campaign.isArchived ? 'Archived' :
                             campaign.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-slate-400">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-4">{campaign.performance?.totalSpins || 0}</td>
                        <td className="py-4">{campaign.performance?.totalVouchers || 0}</td>
                        <td className="py-4">
                          {campaign.performance?.redemptionRate 
                            ? `${campaign.performance.redemptionRate.toFixed(1)}%`
                            : 'N/A'}
                        </td>
                        <td className="py-4">
                          {!campaign.isArchived && (
                            campaign.isActive ? (
                              <button
                                onClick={() => handlePause(campaign.id)}
                                className="text-red-500 hover:text-red-400 text-sm font-bold"
                              >
                                Pause
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnpause(campaign.id)}
                                className="text-green-500 hover:text-green-400 text-sm font-bold"
                              >
                                Unpause
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-slate-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### API Endpoints Used
- `GET /api/admin/super/campaigns` - List campaigns with filters and performance metrics
- `PUT /api/admin/super/campaigns/:id/pause` - Pause a campaign
- `PUT /api/admin/super/campaigns/:id/unpause` - Unpause a campaign
- `GET /api/admin/super/tenants` - Get tenant list for dropdown

### Key Features
1. Search by campaign name
2. Filter by tenant and status (active/inactive/archived)
3. Paginated table with performance metrics
4. Pause/Unpause buttons (disabled for archived campaigns)
5. Redemption rate calculation display
6. Date range display

---

## Task 15.3: Platform Analytics Dashboard Page

### File Location
`app/admin/super/analytics/page.tsx`

### Page Structure

```typescript
'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function PlatformAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [tenantComparison, setTenantComparison] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('super-admin-token');
    if (!token) {
      router.push('/admin/super');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, comparisonRes] = await Promise.all([
        axios.get('/api/admin/super/analytics/platform'),
        axios.get('/api/admin/super/analytics/tenants/comparison?limit=20')
      ]);
      
      setAnalytics(analyticsRes.data);
      setTenantComparison(comparisonRes.data.tenants);
    } catch (err) {
      console.error('Failed to fetch analytics');
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
      {/* Header - same as existing dashboard */}
      {/* ... */}
      
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
                {analytics.topTenants?.map((tenant: any, index: number) => (
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
                {analytics.bottomTenants?.map((tenant: any) => (
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
                {tenantComparison.map((tenant: any) => (
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
```

### API Endpoints Used
- `GET /api/admin/super/analytics/platform` - Platform-wide analytics
- `GET /api/admin/super/analytics/tenants/comparison` - Tenant performance comparison

### Key Features
1. Platform-wide statistics (total spins, vouchers, redemption rate, active %)
2. New and churned tenant counts
3. Month-over-month growth trends
4. Top 10 performers with medal icons
5. Bottom 10 performers (need attention)
6. Complete tenant performance comparison table
7. Color-coded growth indicators (green for positive, red for negative)

---

## Task 15.4: Audit Log Viewer Page

### File Location
`app/admin/super/audit-logs/page.tsx`

### Page Structure

```typescript
'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  
  // Filters
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Admins for dropdown
  const [admins, setAdmins] = useState<any[]>([]);
  
  // Expanded row for viewing details
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('super-admin-token');
    if (!token) {
      router.push('/admin/super');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchAdmins();
    fetchLogs();
  }, [page, adminFilter, actionFilter, startDate, endDate]);

  const fetchAdmins = async () => {
    try {
      // Assuming there's an endpoint to get super admins
      // If not, you can skip this and just use text input for admin ID
      const res = await axios.get('/api/admin/super/admins');
      setAdmins(res.data.admins || []);
    } catch (err) {
      console.error('Failed to fetch admins');
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(adminFilter && { adminId: adminFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const res = await axios.get(`/api/admin/super/audit-logs?${params}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = [
    'EDIT_TENANT',
    'DELETE_TENANT',
    'CHANGE_PLAN',
    'GRANT_OVERRIDE',
    'VOID_VOUCHER',
    'PAUSE_CAMPAIGN',
    'UNPAUSE_CAMPAIGN',
    'RESET_USAGE',
    'LOCK_TENANT',
    'UNLOCK_TENANT'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header - same as existing dashboard */}
      {/* ... */}
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Audit Logs</h2>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <select
              value={adminFilter}
              onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="">All Admins</option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>{admin.email || admin.username}</option>
              ))}
            </select>
            
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>
            
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="Start Date"
            />
            
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="End Date"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="pb-4 font-bold">Timestamp</th>
                      <th className="pb-4 font-bold">Admin</th>
                      <th className="pb-4 font-bold">Action</th>
                      <th className="pb-4 font-bold">Target</th>
                      <th className="pb-4 font-bold">IP Address</th>
                      <th className="pb-4 font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-800/30">
                          <td className="py-4 text-sm text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4">{log.admin?.email || log.admin?.username || 'N/A'}</td>
                          <td className="py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4 text-sm">
                            <div className="text-slate-400">{log.targetType}</div>
                            <div className="font-mono text-xs text-slate-500">{log.targetId}</div>
                          </td>
                          <td className="py-4 text-sm text-slate-400 font-mono">
                            {log.ipAddress || 'N/A'}
                          </td>
                          <td className="py-4">
                            <button
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="text-amber-500 hover:text-amber-400 text-sm font-bold"
                            >
                              {expandedLog === log.id ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>
                        {expandedLog === log.id && (
                          <tr>
                            <td colSpan={6} className="py-4 bg-slate-800/50">
                              <div className="px-4">
                                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Change Details</div>
                                <pre className="text-sm text-slate-300 bg-slate-900 p-4 rounded-lg overflow-x-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                                {log.userAgent && (
                                  <div className="mt-4">
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">User Agent</div>
                                    <div className="text-sm text-slate-400 font-mono">{log.userAgent}</div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-slate-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### API Endpoints Used
- `GET /api/admin/super/audit-logs` - Query audit logs with filters

### Key Features
1. Filter by admin, action type, and date range
2. Paginated table with 50 items per page
3. Expandable rows to view change details (JSON)
4. IP address and user agent tracking
5. Action type badges
6. Timestamp display in local format
7. Target type and ID display

---

## Task 15.5: WhatsApp Monitoring Page

### File Location
`app/admin/super/whatsapp/page.tsx`

### Page Structure

```typescript
'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function WhatsAppMonitoringPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('super-admin-token');
    if (!token) {
      router.push('/admin/super');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/super/whatsapp/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status');
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
      {/* Header - same as existing dashboard */}
      {/* ... */}
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">✅</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Configured</div>
            <div className="text-3xl font-bold text-green-500">
              {status.configuredCount || 0}
            </div>
            <div className="text-sm text-slate-400 mt-2">
              {status.configurationRate?.toFixed(1) || 0}% of tenants
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">❌</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Not Configured</div>
            <div className="text-3xl font-bold text-red-500">
              {status.unconfiguredCount || 0}
            </div>
            <div className="text-sm text-slate-400 mt-2">
              Need WhatsApp setup
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">🏢</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Total Tenants</div>
            <div className="text-3xl font-bold text-blue-500">
              {(status.configuredCount || 0) + (status.unconfiguredCount || 0)}
            </div>
          </div>
        </div>

        {/* Tenant Status List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Tenant WhatsApp Configuration Status</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-4 font-bold">Tenant</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold">API URL</th>
                  <th className="pb-4 font-bold">API Key</th>
                  <th className="pb-4 font-bold">Sender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {status.tenantStatus?.map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30">
                    <td className="py-4 font-bold">{tenant.name}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tenant.configured
                          ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                          : 'bg-red-500/10 text-red-500 border border-red-500/30'
                      }`}>
                        {tenant.configured ? '✓ Configured' : '✗ Not Configured'}
                      </span>
                    </td>
                    <td className="py-4">
                      {tenant.hasApiUrl ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </td>
                    <td className="py-4">
                      {tenant.hasApiKey ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </td>
                    <td className="py-4">
                      {tenant.hasSender ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">About WhatsApp Monitoring</h3>
              <p className="text-sm text-slate-300 mb-2">
                This page shows which tenants have WhatsApp configured for sending voucher notifications.
              </p>
              <p className="text-sm text-slate-400">
                <strong>Note:</strong> Message delivery tracking requires WhatsApp webhook integration, 
                which is planned for a future enhancement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### API Endpoints Used
- `GET /api/admin/super/whatsapp/status` - WhatsApp configuration status

### Key Features
1. Summary statistics (configured, unconfigured, total)
2. Configuration rate percentage
3. Tenant-by-tenant status table
4. Individual field status (API URL, API Key, Sender)
5. Visual indicators (checkmarks and X marks)
6. Info box explaining limitations
7. Color-coded status badges

---

## Navigation Integration

### Adding New Pages to Dashboard

To integrate these pages into the existing Super Admin dashboard, update `app/admin/super/dashboard/page.tsx`:

```typescript
// Add new tabs to the tab state
const [activeTab, setActiveTab] = useState<
  'overview' | 'tenants' | 'plans' | 'vouchers' | 'campaigns' | 'analytics' | 'audit-logs' | 'whatsapp'
>('overview');

// Update the tabs section
<div className="flex space-x-1">
  {([
    'overview',
    'tenants',
    'plans',
    'vouchers',
    'campaigns',
    'analytics',
    'audit-logs',
    'whatsapp'
  ] as const).map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider transition-colors ${
        activeTab === tab
          ? 'text-amber-500 border-b-2 border-amber-500'
          : 'text-slate-400 hover:text-slate-300'
      }`}
    >
      {tab.replace('-', ' ')}
    </button>
  ))}
</div>

// Update the content section
<div className="max-w-7xl mx-auto px-6 py-8">
  {activeTab === 'overview' && <OverviewTab stats={stats} />}
  {activeTab === 'tenants' && <TenantsTab tenants={tenants} onRefresh={fetchData} />}
  {activeTab === 'plans' && <PlansTab plans={plans} onRefresh={fetchData} />}
  {activeTab === 'vouchers' && <VouchersTab />}
  {activeTab === 'campaigns' && <CampaignsTab />}
  {activeTab === 'analytics' && <AnalyticsTab />}
  {activeTab === 'audit-logs' && <AuditLogsTab />}
  {activeTab === 'whatsapp' && <WhatsAppTab />}
</div>
```

Alternatively, create separate route pages:
- `app/admin/super/vouchers/page.tsx`
- `app/admin/super/campaigns/page.tsx`
- `app/admin/super/analytics/page.tsx`
- `app/admin/super/audit-logs/page.tsx`
- `app/admin/super/whatsapp/page.tsx`

And add navigation links in the header or sidebar.

---

## Common Patterns

### Authentication Check
All pages should include this at the top of `useEffect`:
```typescript
const token = localStorage.getItem('super-admin-token');
if (!token) {
  router.push('/admin/super');
  return;
}
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Loading State
```typescript
if (loading) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
```

### Error Handling
```typescript
try {
  // API call
} catch (err: any) {
  alert(err.response?.data?.error || 'Operation failed');
}
```

### Pagination Pattern
```typescript
const [page, setPage] = useState(1);
const [limit] = useState(50);

// In API call
const params = new URLSearchParams({
  page: page.toString(),
  limit: limit.toString(),
  // ... other filters
});

// Pagination controls
<div className="flex justify-between items-center mt-6">
  <div className="text-sm text-slate-400">
    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
  </div>
  <div className="flex space-x-2">
    <button
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1}
      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
    >
      Previous
    </button>
    <button
      onClick={() => setPage(p => p + 1)}
      disabled={page * limit >= total}
      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"
    >
      Next
    </button>
  </div>
</div>
```

---

## Testing Checklist

After implementing each page, verify:

1. ✅ Authentication check redirects to login if no token
2. ✅ Loading state displays correctly
3. ✅ Data fetches and displays properly
4. ✅ Filters update the data correctly
5. ✅ Pagination works (previous/next buttons)
6. ✅ Action buttons (void, pause, etc.) work
7. ✅ Modals open and close correctly
8. ✅ Error messages display for failed operations
9. ✅ Export functionality downloads CSV (where applicable)
10. ✅ Responsive design works on mobile/tablet

---

## Summary

All 5 UI pages follow the same design patterns:
- Dark theme with slate colors
- Amber accent color for primary actions
- Consistent card and table layouts
- Pagination with 50 items per page
- Filter controls at the top
- Modal dialogs for confirmations
- Loading and error states

All backend APIs are implemented and ready to use. Simply create the page files, copy the code, and adjust the header/navigation as needed.
