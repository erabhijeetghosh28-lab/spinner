'use client';

import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WhatsAppMonitoringPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

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
    fetchStatus();
  }, [mounted]);

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

  const handleLogout = () => {
    localStorage.removeItem('super-admin-token');
    localStorage.removeItem('super-admin-data');
    router.push('/admin/super');
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
              <h1 className="text-2xl font-bold text-amber-500">WhatsApp Monitoring</h1>
              <p className="text-slate-400 text-sm">Configuration status across tenants</p>
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
