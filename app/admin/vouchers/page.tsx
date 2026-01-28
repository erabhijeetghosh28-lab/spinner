'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface VoucherStats {
  total: number;
  active: number;
  redeemed: number;
  expired: number;
}

interface Voucher {
  id: string;
  code: string;
  customer: {
    name: string;
    phone: string;
  };
  prize: {
    name: string;
  };
  status: 'active' | 'redeemed' | 'expired';
  createdAt: string;
  expiresAt: string;
  isRedeemed: boolean;
  redeemedAt?: string;
}

export default function VouchersPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VoucherStats>({ total: 0, active: 0, redeemed: 0, expired: 0 });
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  
  const router = useRouter();
  const itemsPerPage = 20;

  useEffect(() => {
    const token = localStorage.getItem('admin-token');
    const storedTenantId = localStorage.getItem('admin-tenant-id');
    const storedAdminData = localStorage.getItem('admin-data');

    if (!token) {
      router.push('/admin');
      return;
    }

    if (storedTenantId) {
      setTenantId(storedTenantId);
    }

    if (storedAdminData) {
      try {
        const admin = JSON.parse(storedAdminData);
        if (admin && admin.isSuperAdmin) {
          router.push('/admin/super/dashboard');
          return;
        }
      } catch (err) {
        console.error('Error parsing admin data:', err);
      }
    }

    // Set global axios headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (storedTenantId) {
      axios.defaults.headers.common['x-tenant-id'] = storedTenantId;
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (tenantId) {
      fetchVouchers();
    }
  }, [tenantId, statusFilter, searchTerm, currentPage]);

  const fetchVouchers = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await axios.get(`/api/vouchers?${params.toString()}`);
      
      setVouchers(response.data.vouchers || []);
      setStats(response.data.stats || { total: 0, active: 0, redeemed: 0, expired: 0 });
      
      const total = response.data.pagination?.total || 0;
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (err) {
      console.error('Failed to fetch vouchers:', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        export: 'true',
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await axios.get(`/api/vouchers?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vouchers-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(err.response?.data?.error || 'Failed to export vouchers');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-500',
      redeemed: 'bg-blue-500/20 text-blue-500',
      expired: 'bg-red-500/20 text-red-500',
    };
    return styles[status as keyof typeof styles] || 'bg-slate-500/20 text-slate-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <AdminNav />
      
      <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-500">Voucher Management</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: '🎫', color: 'text-amber-500' },
            { label: 'Active', value: stats.active, icon: '✓', color: 'text-green-500' },
            { label: 'Redeemed', value: stats.redeemed, icon: '✔', color: 'text-blue-500' },
            { label: 'Expired', value: stats.expired, icon: '✗', color: 'text-red-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-3xl">{stat.icon}</div>
              </div>
              <div className="mt-4">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">{stat.label}</div>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Vouchers</option>
                <option value="active">Active</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by code or phone..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Prize
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No vouchers found
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-amber-500">{voucher.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{voucher.customer.name}</p>
                          <p className="text-sm text-slate-400">{voucher.customer.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{voucher.prize.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(voucher.status)}`}>
                          {voucher.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {new Date(voucher.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {new Date(voucher.expiresAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
