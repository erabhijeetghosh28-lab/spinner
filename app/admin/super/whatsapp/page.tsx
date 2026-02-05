'use client';

import SuperAdminNav from '@/components/admin/super/SuperAdminNav';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WhatsAppMonitoringPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>({
    WHATSAPP_TEXT_API_URL: '',
    WHATSAPP_TEXT_API_KEY: '',
    WHATSAPP_TEXT_SENDER: '',
    WHATSAPP_MEDIA_API_URL: '',
    WHATSAPP_MEDIA_API_KEY: '',
    WHATSAPP_MEDIA_SENDER: '',
    SIGNUP_NOTIFICATION_PHONE: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

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
    fetchGlobalSettings();
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

  const fetchGlobalSettings = async () => {
    try {
      const res = await axios.get('/api/admin/super/settings');
      if (res.data.settings) {
        setGlobalSettings({
          WHATSAPP_TEXT_API_URL: res.data.settings.WHATSAPP_TEXT_API_URL || '',
          WHATSAPP_TEXT_API_KEY: res.data.settings.WHATSAPP_TEXT_API_KEY || '',
          WHATSAPP_TEXT_SENDER: res.data.settings.WHATSAPP_TEXT_SENDER || '',
          WHATSAPP_MEDIA_API_URL: res.data.settings.WHATSAPP_MEDIA_API_URL || '',
          WHATSAPP_MEDIA_API_KEY: res.data.settings.WHATSAPP_MEDIA_API_KEY || '',
          WHATSAPP_MEDIA_SENDER: res.data.settings.WHATSAPP_MEDIA_SENDER || '',
          SIGNUP_NOTIFICATION_PHONE: res.data.settings.SIGNUP_NOTIFICATION_PHONE || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch global settings');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await axios.post('/api/admin/super/settings', {
        settings: globalSettings
      });
      alert('✅ Global WhatsApp settings saved successfully!');
    } catch (err) {
      alert('❌ Failed to save settings');
    } finally {
      setSavingSettings(false);
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
      {/* Header */}
      <SuperAdminNav />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Global Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <div className="text-8xl">⚙️</div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="bg-amber-500/10 text-amber-500 p-2 rounded-lg mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </span>
                Global API Configuration
            </h2>

            <form onSubmit={handleSaveSettings} className="grid md:grid-cols-2 gap-8">
                {/* Text API */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold mb-2">
                        <span>📱 CloudWA Text API (cloudwa_api)</span>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">API URL</label>
                        <input 
                            type="url"
                            value={globalSettings.WHATSAPP_TEXT_API_URL}
                            onChange={(e) => setGlobalSettings({...globalSettings, WHATSAPP_TEXT_API_URL: e.target.value})}
                            placeholder="https://unofficial.cloudwapi.in/send-message"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">API Key</label>
                        <input 
                            type="password"
                            value={globalSettings.WHATSAPP_TEXT_API_KEY}
                            onChange={(e) => setGlobalSettings({...globalSettings, WHATSAPP_TEXT_API_KEY: e.target.value})}
                            required
                            placeholder="Enter CloudWA API Key"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sender Phone (Service Number)</label>
                        <input 
                            type="text"
                            value={globalSettings.WHATSAPP_TEXT_SENDER}
                            onChange={(e) => setGlobalSettings({...globalSettings, WHATSAPP_TEXT_SENDER: e.target.value})}
                            required
                            placeholder="e.g. 9170XXXXXXXX"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Media API */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-blue-400 font-bold mb-2">
                        <span>🖼️ CloudWA Media API (cloudwaimg_api)</span>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">API URL</label>
                        <input 
                            type="url"
                            value={globalSettings.WHATSAPP_MEDIA_API_URL}
                            onChange={(e) => setGlobalSettings({...globalSettings, WHATSAPP_MEDIA_API_URL: e.target.value})}
                            placeholder="https://unofficial.cloudwapi.in/send-media"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">API Key</label>
                        <input 
                            type="password"
                            value={globalSettings.WHATSAPP_MEDIA_API_KEY}
                            onChange={(e) => setGlobalSettings({...globalSettings, WHATSAPP_MEDIA_API_KEY: e.target.value})}
                            placeholder="Enter Media API Key (Optional if same)"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sender Phone (Service Number)</label>
                        <input 
                            type="text"
                            value={globalSettings.WHATSAPP_MEDIA_SENDER}
                            onChange={(e) => setGlobalSettings({...globalSettings, WHATSAPP_MEDIA_SENDER: e.target.value})}
                            placeholder="e.g. 9170XXXXXXXX"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Owner / Signup notifications */}
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center space-x-2 text-green-400 font-bold mb-2">
                        <span>📲 Owner notification (signup alerts)</span>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Owner / Notification Phone Number</label>
                        <input 
                            type="text"
                            value={globalSettings.SIGNUP_NOTIFICATION_PHONE}
                            onChange={(e) => setGlobalSettings({...globalSettings, SIGNUP_NOTIFICATION_PHONE: e.target.value})}
                            placeholder="e.g. 919876543210 – receives new signup details (Business name, Contact person, Email, Phone)"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={savingSettings}
                        className={`bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-10 py-4 rounded-xl shadow-lg shadow-amber-500/20 transform active:scale-95 transition-all flex items-center space-x-2 ${savingSettings ? 'opacity-50' : ''}`}
                    >
                        {savingSettings ? (
                             <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Save Platform Configuration</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">✅</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Configured</div>
            <div className="text-3xl font-bold text-green-500">
              {status?.summary?.configuredCount || 0}
            </div>
            <div className="text-sm text-slate-400 mt-2">
              {status?.summary?.configurationRate?.toFixed(1) || 0}% of tenants
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">❌</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Not Configured</div>
            <div className="text-3xl font-bold text-red-500">
              {status?.summary?.unconfiguredCount || 0}
            </div>
            <div className="text-sm text-slate-400 mt-2">
              Need WhatsApp setup
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="text-3xl mb-4">🏢</div>
            <div className="text-slate-400 text-xs font-medium uppercase mb-1">Total Tenants</div>
            <div className="text-3xl font-bold text-blue-500">
              {status?.summary?.totalTenants || 0}
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
                {status?.tenantStatus?.map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30">
                    <td className="py-4 font-bold">{tenant.name}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tenant.hasWhatsAppConfig
                          ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                          : 'bg-red-500/10 text-red-500 border border-red-500/30'
                      }`}>
                        {tenant.hasWhatsAppConfig ? '✓ Configured' : '✗ Not Configured'}
                      </span>
                    </td>
                    <td className="py-4">
                      {tenant.configDetails?.hasApiUrl ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </td>
                    <td className="py-4">
                      {tenant.configDetails?.hasApiKey ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </td>
                    <td className="py-4">
                      {tenant.configDetails?.hasSender ? (
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
                <strong>Advanced Routing:</strong> QR Code vouchers use the <code>cloudwaimg_api</code> (Media) if configured, 
                otherwise they fallback to <code>cloudwa_api</code> (Text).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
