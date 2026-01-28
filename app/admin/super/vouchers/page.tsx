'use client';

import SuperAdminNav from '@/components/admin/super/SuperAdminNav';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GlobalVouchersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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
    fetchVouchers();
  }, [mounted, page, search, tenantFilter, statusFilter, startDate, endDate]);

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
      {/* Header */}
      <SuperAdminNav />

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
