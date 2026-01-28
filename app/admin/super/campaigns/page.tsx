'use client';

import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GlobalCampaignsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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
    fetchTenants();
    fetchCampaigns();
  }, [mounted, page, search, tenantFilter, statusFilter]);

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

  const handleLogout = () => {
    localStorage.removeItem('super-admin-token');
    localStorage.removeItem('super-admin-data');
    router.push('/admin/super');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin/super/dashboard">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-2xl font-black cursor-pointer">
                👑
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-amber-500">Global Campaigns</h1>
              <p className="text-slate-400 text-sm">Platform-wide campaign management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/admin/super/dashboard" className="text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              <span>Logout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

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
