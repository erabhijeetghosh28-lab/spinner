'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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
    fetchAdmins();
    fetchLogs();
  }, [mounted, page, adminFilter, actionFilter, startDate, endDate]);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('/api/admin/super/admins');
      setAdmins(res.data.admins || []);
    } catch (err) {
      // Silently fail - admin filter is optional if API doesn't exist
      setAdmins([]);
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
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
      setLogs([]);
      setTotal(0);
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
      {/* Header */}
      <SuperAdminNav />

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
