'use client';

import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Replaced lucide-react imports with raw SVGs for project compatibility

interface SecurityAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  metadata?: any;
  resolved: boolean;
  createdAt: string;
}

interface SuspiciousActivity {
  tenantId: string;
  tenantName: string;
  activityType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedAt: string;
}

interface FailedLoginSummary {
  tenantId: string;
  tenantName: string;
  failedCount: number;
  lastFailedAt: string | null;
}

interface SecurityDashboard {
  alerts: SecurityAlert[];
  suspiciousActivity: SuspiciousActivity[];
  failedLogins: FailedLoginSummary[];
}

export default function SecurityDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockingTenant, setLockingTenant] = useState<string | null>(null);

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
    fetchDashboard();
  }, [mounted]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/admin/super/security/dashboard');
      setDashboard(response.data?.data || { alerts: [], suspiciousActivity: [], failedLogins: [] });
    } catch (err: any) {
      console.error('Failed to fetch security dashboard', err);
      setError(err.response?.data?.error || 'Failed to load security dashboard');
      setDashboard({ alerts: [], suspiciousActivity: [], failedLogins: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleLockTenant = async (tenantId: string, tenantName: string) => {
    const reason = prompt(`Enter reason for locking "${tenantName}":`);
    if (!reason) return;
    
    setLockingTenant(tenantId);
    try {
      const response = await axios.put(`/api/admin/super/tenants/${tenantId}/lock`, { reason });
      if (response.data.success) {
        alert(`Tenant "${tenantName}" locked successfully`);
        fetchDashboard();
      } else {
        alert(`Failed to lock tenant: ${response.data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLockingTenant(null);
    }
  };

  const handleUnlockTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Are you sure you want to unlock "${tenantName}"?`)) return;
    
    setLockingTenant(tenantId);
    try {
      const response = await axios.put(`/api/admin/super/tenants/${tenantId}/unlock`);
      if (response.data.success) {
        alert(`Tenant "${tenantName}" unlocked successfully`);
        fetchDashboard();
      } else {
        alert(`Failed to unlock tenant: ${response.data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLockingTenant(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('super-admin-token');
    localStorage.removeItem('super-admin-data');
    router.push('/admin/super');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'text-red-400 bg-red-950 border-red-800';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-950 border-yellow-800';
      case 'LOW':
        return 'text-blue-400 bg-blue-950 border-blue-800';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-900 text-red-300 border-red-700';
      case 'MEDIUM':
        return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'LOW':
        return 'bg-blue-900 text-blue-300 border-blue-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="bg-red-950 border border-red-800 rounded-2xl p-6">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin/super/dashboard">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-2xl font-black cursor-pointer">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-amber-500">Security Dashboard</h1>
              <p className="text-slate-400 text-sm">Threat monitoring & account management</p>
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
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Alerts */}
          <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-red-500 p-6 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-950 rounded-xl">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium uppercase">Active Alerts</div>
                <div className="text-3xl font-bold text-amber-500">
                  {(dashboard?.alerts || []).filter(a => !a.resolved).length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Suspicious Activity */}
          <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-yellow-500 p-6 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-950 rounded-xl">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium uppercase">Suspicious Activity</div>
                <div className="text-3xl font-bold text-amber-500">
                  {dashboard?.suspiciousActivity?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Failed Logins */}
          <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-blue-500 p-6 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-950 rounded-xl">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium uppercase">Failed Logins</div>
                <div className="text-3xl font-bold text-amber-500">
                  {dashboard?.failedLogins?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Security Alerts */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Active Security Alerts</h2>
          {(dashboard?.alerts || []).filter(a => !a.resolved).length > 0 ? (
            <div className="space-y-4">
              {(dashboard?.alerts || []).filter(a => !a.resolved).map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-xl p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-slate-400 text-sm">{alert.eventType}</span>
                      </div>
                      <div className="font-bold text-lg mb-1">{alert.tenantName}</div>
                      <div className="text-slate-300 mb-2">{alert.description}</div>
                      <div className="text-slate-500 text-xs">
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLockTenant(alert.tenantId, alert.tenantName)}
                      disabled={lockingTenant === alert.tenantId}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Lock</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400 text-lg">No active security alerts</p>
            </div>
          )}
        </div>

        {/* Suspicious Activity */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Suspicious Activity</h2>
          {(dashboard?.suspiciousActivity || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="pb-4 font-bold">Tenant</th>
                    <th className="pb-4 font-bold">Activity Type</th>
                    <th className="pb-4 font-bold">Description</th>
                    <th className="pb-4 font-bold">Severity</th>
                    <th className="pb-4 font-bold">Detected At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(dashboard?.suspiciousActivity || []).map((activity, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-4 font-bold">{activity.tenantName}</td>
                      <td className="py-4 text-slate-400">{activity.activityType}</td>
                      <td className="py-4 text-slate-300">{activity.description}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityBadge(activity.severity)}`}>
                          {activity.severity}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 text-sm">
                        {new Date(activity.detectedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              No suspicious activity detected
            </div>
          )}
        </div>

        {/* Failed Login Attempts */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Failed Login Attempts</h2>
          {(dashboard?.failedLogins || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="pb-4 font-bold">Tenant</th>
                    <th className="pb-4 font-bold">Failed Count</th>
                    <th className="pb-4 font-bold">Last Failed At</th>
                    <th className="pb-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(dashboard?.failedLogins || []).map((login) => (
                    <tr key={login.tenantId} className="hover:bg-slate-800/30">
                      <td className="py-4 font-bold">{login.tenantName}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          login.failedCount > 10 
                            ? 'bg-red-900 text-red-300' 
                            : 'bg-yellow-900 text-yellow-300'
                        }`}>
                          {login.failedCount}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 text-sm">
                        {login.lastFailedAt ? new Date(login.lastFailedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleLockTenant(login.tenantId, login.tenantName)}
                          disabled={lockingTenant === login.tenantId}
                          className="flex items-center space-x-1 text-red-400 hover:text-red-300 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Lock Account</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              No failed login attempts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
