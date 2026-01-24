'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ImageUploadButton from '@/components/ImageUploadButton';
import ImageUploader from '@/components/admin/ImageUploader';
import { UsageStats } from '@/components/admin/UsageStats';
import LandingPageBuilder from '@/components/admin/LandingPageBuilder';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'analytics'>('overview');
    const [stats, setStats] = useState<any>(null);
    const [prizes, setPrizes] = useState<any[]>([]);
    const [campaign, setCampaign] = useState<any>({
        spinLimit: 1,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        logoUrl: '',
        templateId: ''
    });
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [tenantSlug, setTenantSlug] = useState<string>('');
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [adminId, setAdminId] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [planInfo, setPlanInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingCampaign, setSavingCampaign] = useState(false);
    const [showSocialTasksModal, setShowSocialTasksModal] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [socialTasks, setSocialTasks] = useState<any[]>([]);
    const [socialTasksLoading, setSocialTasksLoading] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
    const [showLandingPageBuilder, setShowLandingPageBuilder] = useState(false);
    const router = useRouter();

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
            const admin = JSON.parse(storedAdminData);
            setAdminId(admin.id);

            // Redirect Super Admin away from Tenant Dashboard
            if (admin.isSuperAdmin) {
                router.push('/admin/super/dashboard');
                return;
            }
        }

        // Set global axios headers for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (storedTenantId) {
            axios.defaults.headers.common['x-tenant-id'] = storedTenantId;
        }

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const storedTenantId = localStorage.getItem('admin-tenant-id');
            if (!storedTenantId) {
                console.error('No tenant ID found');
                setLoading(false);
                return;
            }

            // Fetch templates for theme selector
            const templatesRes = await axios.get('/api/admin/super/templates');
            setTemplates(templatesRes.data.templates.filter((t: any) => t.isActive));

            // Fetch all campaigns for tenant (for Campaigns tab)
            const campaignsRes = await axios.get(`/api/admin/campaigns?tenantId=${storedTenantId}`);
            const allCampaigns = campaignsRes.data.campaigns || [];
            setCampaigns(allCampaigns);
            
            // Set plan info with debugging and normalization
            const planData = campaignsRes.data.plan;
            console.log('📊 Plan Info from API:', planData);
            
            // Normalize plan data to ensure all feature flags are boolean
            const normalizedPlanInfo = planData ? {
                ...planData,
                allowAnalytics: Boolean(planData.allowAnalytics),
                allowQRCodeGenerator: Boolean(planData.allowQRCodeGenerator),
                allowInventoryTracking: Boolean(planData.allowInventoryTracking)
            } : null;
            
            setPlanInfo(normalizedPlanInfo);
            
            // Log premium features status
            if (normalizedPlanInfo) {
                console.log('✅ Premium Features Status:', {
                    allowAnalytics: normalizedPlanInfo.allowAnalytics,
                    allowQRCodeGenerator: normalizedPlanInfo.allowQRCodeGenerator,
                    allowInventoryTracking: normalizedPlanInfo.allowInventoryTracking
                });
            } else {
                console.warn('⚠️ Plan info is null or undefined');
            }

            // Fetch current active campaign for tenant (within date range)
            let currentCampaignId: string | null = null;
            try {
                const campaignRes = await axios.get(`/api/admin/campaign?tenantId=${storedTenantId}`);
                if (campaignRes.data.campaign) {
                    const camp = campaignRes.data.campaign;
                    currentCampaignId = camp.id;
                    setCampaignId(camp.id);
                    setTenantSlug(camp.tenantSlug || '');
                    setCampaign({
                        spinLimit: camp.spinLimit,
                        spinCooldown: camp.spinCooldown,
                        referralsRequiredForSpin: camp.referralsRequiredForSpin || 0,
                        logoUrl: camp.logoUrl || '',
                        templateId: camp.templateId || '',
                        supportMobile: camp.supportMobile || '',
                        websiteUrl: camp.websiteUrl || '',
                        defaultSpinRewards: camp.defaultSpinRewards || {}
                    });
                }
            } catch (error: any) {
                // If no active campaign found, try to use the first available campaign
                if (error.response?.status === 404 && allCampaigns.length > 0) {
                    // Use the first campaign (even if not currently active)
                    const firstCampaign = allCampaigns[0];
                    currentCampaignId = firstCampaign.id;
                    setCampaignId(firstCampaign.id);
                    setTenantSlug(firstCampaign.tenant?.slug || '');
                    setCampaign({
                        spinLimit: firstCampaign.spinLimit || 1,
                        spinCooldown: firstCampaign.spinCooldown || 24,
                        referralsRequiredForSpin: firstCampaign.referralsRequiredForSpin || 0,
                        logoUrl: firstCampaign.logoUrl || '',
                        templateId: firstCampaign.templateId || '',
                        supportMobile: firstCampaign.supportMobile || '',
                        websiteUrl: firstCampaign.websiteUrl || '',
                        defaultSpinRewards: firstCampaign.defaultSpinRewards || {}
                    });
                } else if (error.response?.status !== 404) {
                    console.error('Error fetching campaign:', error);
                }
            }

            // Fetch prizes for campaign
            if (currentCampaignId) {
                try {
                    const prizesRes = await axios.get(`/api/admin/prizes?campaignId=${currentCampaignId}&tenantId=${storedTenantId}`);
                    setPrizes(prizesRes.data.prizes || []);
                } catch (error: any) {
                    // Handle case when no prizes exist yet
                    if (error.response?.status === 404) {
                        setPrizes([]);
                    } else {
                        console.error('Error fetching prizes:', error);
                        setPrizes([]); // Set empty array to prevent crashes
                    }
                }
            } else {
                setPrizes([]); // No campaign = no prizes
            }

            // Fetch stats (tenant-scoped)
            const statsRes = await axios.get(`/api/admin/stats?tenantId=${storedTenantId}`);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePrizes = async () => {
        setSaving(true);
        try {
            const storedTenantId = localStorage.getItem('admin-tenant-id');
            if (!storedTenantId) {
                alert('Missing tenant information. Please log in again.');
                setSaving(false);
                return;
            }
            if (!campaignId) {
                alert('No campaign selected. Please create a campaign first in the "Campaigns" tab.');
                setSaving(false);
                return;
            }

            await axios.put('/api/admin/prizes', {
                prizes,
                campaignId,
                tenantId: storedTenantId
            });
            alert('Prizes updated successfully!');
            fetchData();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to update prizes';
            console.error('Prize update error:', err);
            alert(`Failed to update prizes: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePrize = async (idx: number, prizeId?: string) => {
        if (!prizeId) {
            // Local-only deletion (for new unsaved prizes)
            setPrizes(prizes.filter((_, i) => i !== idx));
            return;
        }

        if (!campaignId) {
            alert('No campaign selected. Please create a campaign first in the "Campaigns" tab.');
            return;
        }

        if (!confirm('Are you sure you want to delete this prize?')) return;

        try {
            const storedTenantId = localStorage.getItem('admin-tenant-id');
            if (!storedTenantId) {
                alert('Missing tenant information. Please log in again.');
                return;
            }

            await axios.delete('/api/admin/prizes', {
                data: { prizeId, campaignId, tenantId: storedTenantId }
            });
            alert('Prize deleted successfully!');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete prize');
        }
    };

    const handleUpdateCampaign = async () => {
        setSavingCampaign(true);
        try {
            const storedTenantId = localStorage.getItem('admin-tenant-id');
            if (!storedTenantId) {
                alert('Missing tenant information. Please log in again.');
                setSavingCampaign(false);
                return;
            }
            if (!campaignId) {
                alert('No campaign selected. Please create a campaign first in the "Campaigns" tab.');
                setSavingCampaign(false);
                return;
            }

            await axios.put('/api/admin/campaign', {
                campaignId,
                tenantId: storedTenantId,
                ...campaign
            });
            alert('Campaign settings updated successfully!');
            fetchData();
        } catch (err) {
            alert('Failed to update campaign settings');
        } finally {
            setSavingCampaign(false);
        }
    };

    const handleExportUsers = async () => {
        try {
            const storedTenantId = localStorage.getItem('admin-tenant-id');
            if (!storedTenantId) {
                alert('Missing tenant information');
                return;
            }

            // Fetch CSV data
            const response = await axios.get(`/api/admin/export/users?tenantId=${storedTenantId}`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Export error:', err);
            alert(err.response?.data?.error || 'Failed to export users');
        }
    };

    const updatePrize = (index: number, field: string, value: any) => {
        const newPrizes = [...prizes];
        newPrizes[index][field] = value;
        setPrizes(newPrizes);
    };

    const addPrize = () => {
        if (prizes.length >= 10) return;
        const newPrize = {
            name: 'New Offer',
            probability: 10,
            dailyLimit: 50,
            isActive: true,
            showTryAgainMessage: false,
            position: prizes.length,
            colorCode: prizes.length % 2 === 0 ? '#1E3A8A' : '#f59e0b'
        };
        setPrizes([...prizes, newPrize]);
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8 lg:p-12">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-2xl font-black">W</div>
                        <h1 className="text-3xl font-bold text-amber-500 uppercase tracking-tight">Campaign Manager</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => { fetchData(); alert('Data refreshed!'); }}
                            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-800"
                            title="Refresh Data"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-800"
                            title="Change Password"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span>Change Password</span>
                        </button>
                        <button
                            onClick={() => { localStorage.removeItem('admin-token'); localStorage.removeItem('admin-tenant-id'); localStorage.removeItem('admin-tenant-data'); localStorage.removeItem('admin-data'); router.push('/admin'); }}
                            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-800"
                        >
                            <span>Logout</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-slate-900 border-b border-slate-800 mb-8">
                    <div className="flex space-x-1">
                        {(['overview', 'campaigns', ...(planInfo?.allowAnalytics ? ['analytics'] : [])] as ('overview' | 'campaigns' | 'analytics')[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as 'overview' | 'campaigns' | 'analytics')}
                                className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider transition-colors ${activeTab === tab
                                    ? 'text-amber-500 border-b-2 border-amber-500'
                                    : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            {[
                                { label: 'Spins Today', value: stats?.stats?.spinsToday || 0, icon: '🎡', color: 'text-amber-500' },
                                { label: 'Total Users', value: stats?.stats?.totalUsers || 0, icon: '👥', color: 'text-blue-500' },
                                { label: 'Prizes Won', value: stats?.stats?.prizesWonToday || 0, icon: '🏆', color: 'text-green-500' },
                                { label: 'Conv. Rate', value: `${stats?.stats?.conversionRate ?? 0}%`, icon: '📈', color: 'text-purple-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="text-3xl">{stat.icon}</div>
                                        <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-500 font-bold uppercase tracking-widest">Live</div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="text-slate-400 text-xs font-medium uppercase mb-1">{stat.label}</div>
                                        <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* Main Config Column */}
                            <div className="lg:col-span-9 space-y-6">
                                {/* Prize Configuration */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
                                    <PrizeTable
                                        prizes={prizes}
                                        onUpdate={updatePrize}
                                        onAdd={addPrize}
                                        onDelete={handleDeletePrize}
                                        allowInventoryTracking={Boolean(planInfo?.allowInventoryTracking)}
                                        campaignId={campaignId}
                                    />

                                    <div className="mt-12 pt-8 border-t border-slate-800">
                                        <button
                                            onClick={handleUpdatePrizes}
                                            disabled={saving || !campaignId}
                                            className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl transition-all uppercase shadow-lg shadow-amber-500/30 text-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-500 disabled:hover:to-amber-600"
                                            title={!campaignId ? 'Please create a campaign first' : ''}
                                        >
                                            {saving ? 'Updating Wheel...' : 'Sync Wheel Update'}
                                        </button>
                                    </div>
                                </div>

                                {/* Campaign Settings */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold">Campaign Settings</h2>
                                        <p className="text-slate-500 text-sm mt-1">Configure campaign behavior and appearance</p>
                                        {!campaignId && (
                                            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                <p className="text-amber-500 text-xs">
                                                    ⚠️ No campaign selected. Please create a campaign in the "Campaigns" tab first.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <CampaignSettingsForm
                                        campaign={campaign}
                                        setCampaign={setCampaign}
                                        templates={templates}
                                        campaignId={campaignId}
                                    />

                                    <button
                                        onClick={handleUpdateCampaign}
                                        disabled={savingCampaign || !campaignId}
                                        className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded-xl border border-amber-500/50 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs mt-8"
                                    >
                                        {savingCampaign ? 'Saving...' : 'Update Campaign Settings'}
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar Column */}
                            <div className="lg:col-span-3 space-y-4">
                                {/* Customer Link Card */}
                                <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
                                    <h2 className="text-lg font-bold text-indigo-400 mb-1">Customer Campaign Link</h2>
                                    <p className="text-xs text-slate-400 mb-4">Share this unique link with your customers.</p>

                                    <div className="flex items-center space-x-2 bg-black/40 border border-slate-700 rounded-xl p-2">
                                        <code className="flex-1 text-xs text-indigo-300 font-mono truncate px-2">
                                            {typeof window !== 'undefined' ? `${window.location.origin}/?tenant=${tenantSlug}` : 'Loading...'}
                                        </code>
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/?tenant=${tenantSlug}`;
                                                navigator.clipboard.writeText(url);
                                                alert('Campaign link copied to clipboard!');
                                            }}
                                            className="p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
                                            title="Copy Link"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                        </button>
                                    </div>
                                    <div className="mt-3 flex justify-between items-center text-[9px] text-slate-500 font-medium uppercase tracking-widest">
                                        <span>Unique URL</span>
                                        <a
                                            href={typeof window !== 'undefined' ? `/?tenant=${tenantSlug}` : '#'}
                                            target="_blank"
                                            className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                                        >
                                            <span>Test</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    </div>
                                </div>

                                {/* Embed Code Card */}
                                <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-5 shadow-xl">
                                    <h2 className="text-lg font-bold text-purple-400 mb-1">Embed on Website</h2>
                                    <p className="text-xs text-slate-400 mb-4">Copy code to embed the wheel.</p>

                                    <div className="bg-black/60 border border-slate-700 rounded-lg p-3 mb-3 max-h-24 overflow-y-auto">
                                        <code className="text-[10px] text-purple-300 font-mono block whitespace-pre-wrap break-all">
                                            {`<iframe src="${typeof window !== 'undefined' ? `${window.location.origin}/?tenant=${tenantSlug}` : 'Loading...'}" style="width: 100%; height: 800px; border: none;"></iframe>`}
                                        </code>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const embedCode = `<iframe src="${window.location.origin}/?tenant=${tenantSlug}" style="width: 100%; height: 800px; border: none;"></iframe>`;
                                            navigator.clipboard.writeText(embedCode);
                                            alert('Embed code copied to clipboard!');
                                        }}
                                        className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-400 font-bold rounded-lg border border-purple-500/50 transition-all text-xs"
                                    >
                                        Copy Embed Code
                                    </button>
                                </div>

                                {/* Recent Activity - Compact */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                    <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {stats?.recentUsers?.slice(0, 5).map((user: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between border-b border-slate-800/50 pb-2.5 last:border-0 group">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-0.5">
                                                        <span className="font-semibold text-white text-xs group-hover:text-amber-500 transition-colors truncate">{user.name || 'Anonymous'}</span>
                                                        <span className="text-[8px] text-slate-600 font-bold bg-slate-800 px-1 py-0.5 rounded whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center text-[10px] text-slate-400 font-mono">
                                                        <svg className="w-2.5 h-2.5 mr-1 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                        <span className="truncate">{user.phone}</span>
                                                    </div>
                                                </div>
                                                <span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] border border-amber-500/20 ml-2 whitespace-nowrap">{user.referralCount || 0}</span>
                                            </div>
                                        ))}
                                        {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                                            <div className="text-center py-8">
                                                <div className="text-2xl mb-2">🧊</div>
                                                <p className="text-slate-500 text-xs italic">No users yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Export Panel - Compact */}
                                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5 shadow-xl">
                                    <h3 className="text-base font-bold text-amber-500 mb-2">Export Data</h3>
                                    <p className="text-xs text-slate-400 mb-4">Download CSV list of campaign users.</p>
                                    <button
                                        onClick={handleExportUsers}
                                        className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-slate-900 font-bold rounded-lg border border-amber-500/50 transition-all text-xs"
                                    >
                                        Download CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'campaigns' && tenantId && (
                    <CampaignsTab
                        campaigns={campaigns}
                        templates={templates}
                        planInfo={planInfo}
                        tenantId={tenantId}
                        tenantSlug={tenantSlug}
                        onRefresh={fetchData}
                    />
                )}

                {activeTab === 'analytics' && tenantId && planInfo?.allowAnalytics && (
                    <AnalyticsTab
                        tenantId={tenantId}
                    />
                )}
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && adminId && (
                <ChangePasswordModal
                    adminId={adminId}
                    isSuperAdmin={false}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}
        </div>
    );
}


// Reusable Prize Table Component
function PrizeTable({
    prizes,
    onUpdate,
    onAdd,
    onDelete,
    allowInventoryTracking,
    campaignId
}: {
    prizes: any[];
    onUpdate: (idx: number, field: string, value: any) => void;
    onAdd: () => void;
    onDelete: (idx: number, id?: string) => void;
    allowInventoryTracking?: boolean;
    campaignId?: string | null;
}) {
    return (
        <>
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Wheel segments & Offers</h2>
                    <p className="text-slate-400 text-sm">Configure up to 10 prizes for the wheel</p>
                </div>
                <button
                    onClick={onAdd}
                    disabled={prizes.length >= 10}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-6 py-2 rounded-xl text-sm font-bold border border-amber-500/50 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                    <span>+ Add Offer</span>
                </button>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b-2 border-slate-700">
                            <th className="pb-5 pt-2 px-4 font-bold text-left">Image</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[180px]">Offer Name</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[140px]">Coupon Code</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Prob (%)</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[120px]">Daily Limit</th>
                            {allowInventoryTracking && (
                                <>
                                    <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Stock</th>
                                    <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Low Alert</th>
                                </>
                            )}
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Status</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[120px]">Try Again</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-right min-w-[80px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {prizes && prizes.length > 0 ? (
                            prizes.map((prize, idx) => (
                                <tr key={prize.id || idx} className="group hover:bg-slate-800/40 transition-colors">
                                    <td className="py-6 px-4">
                                        <ImageUploadButton
                                            currentImageUrl={prize.imageUrl}
                                            onUploadComplete={(url) => onUpdate(idx, 'imageUrl', url)}
                                            onUploadError={(error) => {
                                                console.error('Image upload failed:', error);
                                            }}
                                        />
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="text"
                                            value={prize.name}
                                            onChange={(e) => onUpdate(idx, 'name', e.target.value)}
                                            className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-full py-2 text-slate-200 text-sm font-medium transition-colors"
                                            placeholder="Enter offer name"
                                        />
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="text"
                                            value={prize.couponCode || ''}
                                            placeholder="CODE123"
                                            onChange={(e) => onUpdate(idx, 'couponCode', e.target.value)}
                                            className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-full py-2 text-slate-200 font-mono text-sm uppercase transition-colors"
                                        />
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                value={prize.probability}
                                                onChange={(e) => onUpdate(idx, 'probability', e.target.value)}
                                                className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-16 py-2 text-slate-200 text-sm font-medium transition-colors"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-slate-500 text-sm">%</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="number"
                                            value={prize.dailyLimit}
                                            onChange={(e) => onUpdate(idx, 'dailyLimit', e.target.value)}
                                            className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                            min="0"
                                        />
                                    </td>
                                    {allowInventoryTracking && (
                                        <>
                                            <td className="py-6 px-4">
                                                <input
                                                    type="number"
                                                    value={prize.currentStock ?? ''}
                                                    onChange={(e) => onUpdate(idx, 'currentStock', e.target.value === '' ? null : parseInt(e.target.value))}
                                                    className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                                    placeholder="∞"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="py-6 px-4">
                                                <input
                                                    type="number"
                                                    value={prize.lowStockAlert ?? ''}
                                                    onChange={(e) => onUpdate(idx, 'lowStockAlert', e.target.value === '' ? null : parseInt(e.target.value))}
                                                    className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                                    placeholder="0"
                                                    min="0"
                                                />
                                            </td>
                                        </>
                                    )}
                                    <td className="py-6 px-4">
                                        <button
                                            onClick={() => onUpdate(idx, 'isActive', !prize.isActive)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${prize.isActive ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 border-2 border-red-500/40 hover:bg-red-500/30'}`}
                                        >
                                            {prize.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="py-6 px-4">
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={prize.showTryAgainMessage || false}
                                                onChange={(e) => onUpdate(idx, 'showTryAgainMessage', e.target.checked)}
                                                className="w-5 h-5 rounded border-2 border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-2 cursor-pointer transition-all"
                                                title="Enable to show 'Sorry, try again in some time' when spinner lands on this prize"
                                            />
                                            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                                                {prize.showTryAgainMessage ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </label>
                                    </td>
                                    <td className="py-6 px-4 text-right">
                                        <button
                                            onClick={() => onDelete(idx, prize.id)}
                                            className="p-2.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/15 rounded-lg transition-all group"
                                            title="Delete Offer"
                                            type="button"
                                        >
                                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={allowInventoryTracking ? 10 : 8} className="py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center space-y-2">
                                        <span className="text-4xl text-slate-700">🎁</span>
                                        <span className="text-sm">No prizes configured yet.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

// Reusable Campaign Settings Form Component
function CampaignSettingsForm({
    campaign,
    setCampaign,
    templates,
    campaignId
}: {
    campaign: any;
    setCampaign: (c: any) => void;
    templates: any[];
    campaignId?: string | null;
}) {
    return (
        <div className="space-y-6 mb-8">
            {/* Spin Limits */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Max Spins Per User</label>
                    <input
                        type="number"
                        value={campaign.spinLimit}
                        onChange={(e) => setCampaign({ ...campaign, spinLimit: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 italic">Example: Set to 1 for "One spin per user"</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Cooldown Period (Hours)</label>
                    <input
                        type="number"
                        value={campaign.spinCooldown}
                        onChange={(e) => setCampaign({ ...campaign, spinCooldown: parseInt(e.target.value) || 24 })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 italic">Example: Set to 24 for "Once a day"</p>
                </div>
            </div>

            {/* Referral Threshold */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Referral Threshold</label>
                <input
                    type="number"
                    value={campaign.referralsRequiredForSpin || 0}
                    onChange={(e) => setCampaign({ ...campaign, referralsRequiredForSpin: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm"
                    placeholder="0"
                />
                <p className="text-[10px] text-slate-500 mt-2 italic">Set to 0 to disable. Example: 5 = "Invite 5 friends for 1 bonus spin"</p>
            </div>

            {/* Logo URL */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Logo URL (Wheel Center)</label>
                                <div className="mb-2">
                    <ImageUploader
                        onUploadComplete={(url) => setCampaign({ ...campaign, logoUrl: url })}
                        currentImageUrl={campaign.logoUrl}
                        label="Upload Logo"
                    />
                </div>
                <input
                    type="url"
                    value={campaign.logoUrl || ''}
                    onChange={(e) => setCampaign({ ...campaign, logoUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm mt-2"
                    placeholder="Or paste image URL here"
                />
                <p className="text-[10px] text-slate-500 mt-2 italic">Upload logo or paste URL. Image will be optimized automatically. Displayed in wheel center.</p>
            </div>

            {/* Support Contact */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Support Mobile Number</label>
                    <input
                        type="tel"
                        value={campaign.supportMobile || ''}
                        onChange={(e) => setCampaign({ ...campaign, supportMobile: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm"
                        placeholder="919899011616"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 italic">Shown to users for support (WhatsApp link)</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Website URL</label>
                    <input
                        type="url"
                        value={campaign.websiteUrl || ''}
                        onChange={(e) => setCampaign({ ...campaign, websiteUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm"
                        placeholder="https://mystore.com"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 italic">Optional: Link to your website</p>
                </div>
            </div>

            {/* Default Spin Rewards for Social Tasks */}
            <div className="border-t border-slate-700 pt-6 mt-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-4">Default Spin Rewards (Social Tasks)</label>
                <p className="text-[10px] text-slate-500 mb-4 italic">Set default spin rewards for each action type. These will be pre-filled when creating social tasks.</p>
                <div className="grid md:grid-cols-2 gap-4">
                    {['VISIT_PAGE', 'VISIT_PROFILE', 'VIEW_POST', 'VIEW_DISCUSSION', 'VISIT_TO_SHARE'].map((actionType) => {
                        const defaultRewards = (campaign.defaultSpinRewards as any) || {};
                        const value = defaultRewards[actionType] || 1;
                        return (
                            <div key={actionType}>
                                <label className="block text-xs font-semibold text-slate-400 mb-2">
                                    {actionType.replace('_', ' ')}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={value}
                                    onChange={(e) => {
                                        const newRewards = { ...defaultRewards, [actionType]: parseInt(e.target.value) || 1 };
                                        setCampaign({ ...campaign, defaultSpinRewards: newRewards });
                                    }}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}

// Campaigns Tab Component
function CampaignsTab({ campaigns, templates, planInfo, tenantId, tenantSlug, onRefresh }: {
    campaigns: any[];
    templates: any[];
    planInfo: any;
    tenantId: string;
    tenantSlug: string;
    onRefresh: () => void;
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [modalPrizes, setModalPrizes] = useState<any[]>([]);
    const [limitInfo, setLimitInfo] = useState<any>(null);
    const [loadingLimit, setLoadingLimit] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logoUrl: '',
        templateId: '',
        supportMobile: '',
        websiteUrl: '',
        spinLimit: 1,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [fetchingPrizes, setFetchingPrizes] = useState(false);
    const [showSocialTasksModal, setShowSocialTasksModal] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [socialTasks, setSocialTasks] = useState<any[]>([]);
    const [socialTasksLoading, setSocialTasksLoading] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
    const [landingPageStatus, setLandingPageStatus] = useState<Record<string, boolean>>({});
    const [showLandingPageBuilder, setShowLandingPageBuilder] = useState(false);

    // Fetch limit info when component mounts or tenantId changes
    useEffect(() => {
        if (tenantId) {
            fetchLimitInfo();
        }
    }, [tenantId]);

    // Fetch landing page status for all campaigns
    useEffect(() => {
        if (campaigns.length > 0 && tenantId) {
            fetchLandingPageStatus();
        }
    }, [campaigns, tenantId]);

    const fetchLandingPageStatus = async () => {
        const statusMap: Record<string, boolean> = {};
        for (const camp of campaigns) {
            try {
                const res = await axios.get(`/api/admin/landing-page?campaignId=${camp.id}&tenantId=${tenantId}`);
                statusMap[camp.id] = res.data.landingPage?.isPublished || false;
            } catch (err) {
                statusMap[camp.id] = false;
            }
        }
        setLandingPageStatus(statusMap);
    };

    const fetchLimitInfo = async () => {
        setLoadingLimit(true);
        try {
            const res = await axios.get(`/api/admin/campaigns/check-limit?tenantId=${tenantId}`);
            setLimitInfo(res.data);
        } catch (err) {
            console.error('Error fetching limit info:', err);
        } finally {
            setLoadingLimit(false);
        }
    };

    const handleOpenModal = async (campaign?: any) => {
        if (campaign) {
            setEditingCampaign(campaign);
            setFormData({
                name: campaign.name,
                description: campaign.description || '',
                logoUrl: campaign.logoUrl || '',
                templateId: campaign.templateId || '',
                supportMobile: campaign.supportMobile || '',
                websiteUrl: campaign.websiteUrl || '',
                spinLimit: campaign.spinLimit,
                spinCooldown: campaign.spinCooldown,
                referralsRequiredForSpin: campaign.referralsRequiredForSpin || 0,
                isActive: campaign.isActive
            });

            // Fetch prizes for this specific campaign
            setFetchingPrizes(true);
            try {
                const res = await axios.get(`/api/admin/prizes?campaignId=${campaign.id}&tenantId=${tenantId}`);
                setModalPrizes(res.data.prizes || []);
            } catch (error) {
                console.error('Error fetching modal prizes:', error);
                setModalPrizes([]);
            } finally {
                setFetchingPrizes(false);
            }
        } else {
            setEditingCampaign(null);
            setFormData({
                name: '',
                description: '',
                logoUrl: '',
                templateId: templates[0]?.id || '',
                supportMobile: '',
                websiteUrl: '',
                spinLimit: 1,
                spinCooldown: 24,
                referralsRequiredForSpin: 0,
                isActive: true
            });
            // Initial default prizes for new campaign
            setModalPrizes([
                { name: '10% Off', probability: 40, dailyLimit: 100, isActive: true, position: 0, colorCode: '#1E3A8A' },
                { name: 'Free Gift', probability: 10, dailyLimit: 10, isActive: true, position: 1, colorCode: '#f59e0b' },
                { name: 'Try Again', probability: 50, dailyLimit: 9999, isActive: true, position: 2, colorCode: '#1E3A8A' }
            ]);
        }
        setShowModal(true);
    };

    const updateModalPrize = (idx: number, field: string, value: any) => {
        const newPrizes = [...modalPrizes];
        newPrizes[idx][field] = value;
        setModalPrizes(newPrizes);
    };

    const addModalPrize = () => {
        if (modalPrizes.length >= 10) return;
        setModalPrizes([...modalPrizes, {
            name: 'New Offer',
            probability: 10,
            dailyLimit: 50,
            isActive: true,
            position: modalPrizes.length,
            colorCode: modalPrizes.length % 2 === 0 ? '#1E3A8A' : '#f59e0b'
        }]);
    };

    const handleModalDeletePrize = (idx: number) => {
        const prizeToDelete = modalPrizes[idx];
        if (prizeToDelete.id && editingCampaign) {
            // Optional: Alert that this will be deleted permanently on save
        }
        const newPrizes = modalPrizes.filter((_, i) => i !== idx);
        setModalPrizes(newPrizes);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCampaign(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!tenantId) {
                alert('Missing tenant information');
                return;
            }

            const payload = {
                ...formData,
                tenantId,
                campaignId: editingCampaign?.id,
                prizes: modalPrizes // Include prizes for atomic update
            };

            if (editingCampaign) {
                await axios.put('/api/admin/campaigns', payload);
            } else {
                await axios.post('/api/admin/campaigns', payload);
            }
            handleCloseModal();
            onRefresh();
            fetchLimitInfo(); // Refresh limit info after creating campaign
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to save campaign';
            console.error('Campaign save error:', err);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (campaignId: string) => {
        if (!confirm('Are you sure you want to archive this campaign? It will be hidden but not deleted. You can restore it later if needed.')) return;

        try {
            if (!tenantId) {
                alert('Missing tenant information');
                return;
            }

            await axios.delete('/api/admin/campaigns', {
                data: { campaignId, tenantId }
            });
            alert('Campaign archived successfully!');
            onRefresh();
            fetchLimitInfo(); // Refresh limit info after archiving
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to archive campaign');
        }
    };

    const handleOpenSocialTasksModal = async (campaignId: string) => {
        setSelectedCampaignId(campaignId);
        setShowSocialTasksModal(true);
        await fetchSocialTasks(campaignId);
    };

    const fetchSocialTasks = async (campaignId: string) => {
        setSocialTasksLoading(true);
        try {
            const res = await axios.get(`/api/admin/social-tasks?campaignId=${campaignId}&tenantId=${tenantId}`);
            setSocialTasks(res.data.tasks || []);
            setSubscriptionPlan(res.data.subscriptionPlan);
        } catch (err: any) {
            console.error('Error fetching social tasks:', err);
            alert(err.response?.data?.error || 'Failed to load social tasks');
        } finally {
            setSocialTasksLoading(false);
        }
    };

    const handleCreateSocialTask = async (taskData: any) => {
        try {
            await axios.post('/api/admin/social-tasks', {
                ...taskData,
                campaignId: selectedCampaignId,
                tenantId,
            });
            alert('Social task created successfully!');
            if (selectedCampaignId) await fetchSocialTasks(selectedCampaignId);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create social task');
        }
    };

    const handleDeleteSocialTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this social task?')) return;
        try {
            await axios.delete('/api/admin/social-tasks', {
                data: { taskId, tenantId },
            });
            alert('Social task deleted successfully!');
            if (selectedCampaignId) await fetchSocialTasks(selectedCampaignId);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete social task');
        }
    };

    const now = new Date();

    return (
        <>
            {/* Usage Stats Component */}
            {tenantId && <UsageStats tenantId={tenantId} />}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Campaigns</h2>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        disabled={limitInfo && !limitInfo.canCreate}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + New Campaign
                    </button>
                </div>

                {limitInfo && !limitInfo.canCreate && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-3 rounded-lg mb-6">
                        <div className="font-bold mb-1">Campaign Limit Reached</div>
                        <div className="text-sm">
                            {limitInfo.activeCount >= limitInfo.activeLimit && (
                                <p>• You have reached your active campaign limit ({limitInfo.activeCount}/{limitInfo.activeLimit}). Archive an existing campaign to create a new one.</p>
                            )}
                            {limitInfo.monthlyCount >= limitInfo.monthlyLimit && (
                                <p>• You have reached your monthly creation limit ({limitInfo.monthlyCount}/{limitInfo.monthlyLimit}). Wait until next month or upgrade your plan.</p>
                            )}
                            <p className="mt-2">
                                <button
                                    onClick={() => {
                                        // TODO: Navigate to upgrade/billing page
                                        alert('Upgrade feature coming soon! Contact support to upgrade your plan.');
                                    }}
                                    className="underline font-bold hover:text-amber-400"
                                >
                                    Upgrade your plan
                                </button>
                                {' '}to create more campaigns.
                            </p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                                <th className="pb-4 font-bold">Name</th>
                                <th className="pb-4 font-bold">Template</th>
                                <th className="pb-4 font-bold">Status</th>
                                <th className="pb-4 font-bold">Prizes</th>
                                <th className="pb-4 font-bold">Spins</th>
                                <th className="pb-4 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {campaigns.map((camp) => {
                                const startDate = new Date(camp.startDate);
                                const endDate = new Date(camp.endDate);
                                const isActive = camp.isActive && startDate <= now && endDate >= now;
                                const isScheduled = startDate > now;
                                const isExpired = endDate < now;

                                return (
                                    <tr key={camp.id} className="hover:bg-slate-800/30">
                                        <td className="py-4 font-bold">{camp.name}</td>
                                        <td className="py-4 text-slate-400">{camp.template?.name || 'None'}</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isActive
                                                ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                                                : isScheduled
                                                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                                                    : isExpired
                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                                                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                                                }`}>
                                                {isActive ? 'Active' : isScheduled ? 'Scheduled' : isExpired ? 'Expired' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4">{camp._count.prizes}</td>
                                        <td className="py-4">{camp._count.spins}</td>
                                        <td className="py-4">
                                            <div className="flex items-center space-x-2">
                                                {planInfo?.allowQRCodeGenerator && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const qrUrl = `/api/admin/qr?tenantId=${tenantId}&campaignId=${camp.id}&format=png`;
                                                                const response = await axios.get(qrUrl, {
                                                                    responseType: 'blob'
                                                                });
                                                                
                                                                // Create a blob URL and download it
                                                                const blob = new Blob([response.data], { type: 'image/png' });
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                link.download = `qr-code-${camp.name.replace(/\s+/g, '-')}.png`;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                link.remove();
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (err: any) {
                                                                console.error('QR Code generation error:', err);
                                                                alert(err.response?.data?.error || 'Failed to generate QR code');
                                                            }
                                                        }}
                                                        className="text-blue-500 hover:text-blue-400 text-sm font-bold"
                                                        title="Generate QR Code"
                                                    >
                                                        QR
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleOpenSocialTasksModal(camp.id)}
                                                    className="text-purple-500 hover:text-purple-400 text-sm font-bold"
                                                    title="Manage Social Tasks"
                                                >
                                                    Social
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedCampaignId(camp.id);
                                                        setShowLandingPageBuilder(true);
                                                    }}
                                                    className="relative text-green-500 hover:text-green-400 text-sm font-bold flex items-center gap-1.5"
                                                    title={landingPageStatus[camp.id] ? "Landing Page Published - Click to Edit" : "Edit Landing Page"}
                                                >
                                                    Landing
                                                    {landingPageStatus[camp.id] && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Published"></span>
                                                    )}
                                                    {landingPageStatus[camp.id] ? (
                                                        <span className="text-[10px] text-green-400 font-normal">●</span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-500 font-normal">○</span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(camp)}
                                                    className="text-amber-500 hover:text-amber-400 text-sm font-bold"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(camp.id)}
                                                    className="text-red-500 hover:text-red-400 text-sm font-bold"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {campaigns.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No campaigns yet. Create your first campaign to get started!
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-amber-500">
                                    {editingCampaign ? 'Manage Campaign' : 'Create New Campaign'}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">Configure all campaign details, prizes, and behavior</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-xl">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-12">
                            {/* Section 1: Basic Info */}
                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                                <h3 className="text-lg font-bold mb-6 flex items-center">
                                    <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                                    Basic Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Campaign Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Season Sale 2024"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                            rows={2}
                                            placeholder="Optional description for internal use"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Prizes */}
                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                                <h3 className="text-lg font-bold mb-6 flex items-center">
                                    <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                                    Wheel segments & Offers
                                </h3>
                                {fetchingPrizes ? (
                                    <div className="py-12 text-center text-slate-500 italic">Loading prizes...</div>
                                ) : (
                                    <PrizeTable
                                        prizes={modalPrizes}
                                        onUpdate={updateModalPrize}
                                        onAdd={addModalPrize}
                                        onDelete={handleModalDeletePrize}
                                        allowInventoryTracking={Boolean(planInfo?.allowInventoryTracking)}
                                        campaignId={editingCampaign?.id}
                                    />
                                )}
                            </div>

                            {/* Section 3: Behavior & Branding */}
                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                                <h3 className="text-lg font-bold mb-6 flex items-center">
                                    <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                                    Behavior & Branding
                                </h3>
                                <CampaignSettingsForm
                                    campaign={formData}
                                    setCampaign={(updates) => setFormData({ ...formData, ...updates })}
                                    templates={templates}
                                />
                                <div className="mt-6">
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 transition-all"
                                        />
                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Enabled (Allow users to access if within date range)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-8 sticky bottom-0 bg-slate-900 py-4 border-t border-slate-800">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-4 rounded-xl disabled:opacity-50 shadow-lg shadow-amber-500/10 transition-all uppercase tracking-widest active:scale-[0.98]"
                                >
                                    {loading ? 'Processing...' : editingCampaign ? 'Save All Changes' : 'Create & Launch Campaign'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-widest text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Social Tasks Modal */}
            {showSocialTasksModal && selectedCampaignId && (
                <SocialTasksModal
                    campaignId={selectedCampaignId}
                    tenantId={tenantId}
                    tasks={socialTasks}
                    loading={socialTasksLoading}
                    subscriptionPlan={subscriptionPlan}
                    onClose={() => {
                        setShowSocialTasksModal(false);
                        setSelectedCampaignId(null);
                        setSocialTasks([]);
                    }}
                    onRefresh={() => selectedCampaignId && fetchSocialTasks(selectedCampaignId)}
                />
            )}

            {/* Landing Page Builder Modal */}
            {showLandingPageBuilder && selectedCampaignId && tenantId && (
                <LandingPageBuilder
                    campaignId={selectedCampaignId}
                    tenantId={tenantId}
                    onClose={() => {
                        setShowLandingPageBuilder(false);
                        setSelectedCampaignId(null);
                        fetchLandingPageStatus(); // Refresh status after closing
                    }}
                />
            )}
        </>
    );
}

// Format action type for display (policy-compliant language)
function formatActionTypeForDisplay(actionType: string): string {
    const actionMap: { [key: string]: string } = {
        // New policy-compliant types
        VISIT_PAGE: 'Visit Page',
        VISIT_PROFILE: 'Visit Profile',
        VIEW_POST: 'View Post',
        VIEW_DISCUSSION: 'View Discussion',
        VISIT_TO_SHARE: 'Visit to Share',
        // Legacy types (map to compliant language)
        LIKE_PAGE: 'Visit Page',
        LIKE_POST: 'View Post',
        FOLLOW: 'Visit Profile',
        SHARE: 'Visit to Share',
        COMMENT: 'View Discussion',
    };
    return actionMap[actionType.toUpperCase()] || actionType.replace('_', ' ');
}

// Social Tasks Management Modal
function SocialTasksModal({
    campaignId,
    tenantId,
    tasks,
    loading,
    subscriptionPlan,
    onClose,
    onRefresh,
}: {
    campaignId: string;
    tenantId: string;
    tasks: any[];
    loading: boolean;
    subscriptionPlan: any;
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        platform: 'FACEBOOK',
        actionType: 'VISIT_PAGE', // Default to new policy-compliant type
        title: '',
        targetUrl: '',
        spinsReward: 1,
        displayOrder: 0,
    });
    const [submitting, setSubmitting] = useState(false);
    const [campaign, setCampaign] = useState<any>(null);

    // Fetch campaign to get default spin rewards
    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const res = await axios.get(`/api/admin/campaign?campaignId=${campaignId}&tenantId=${tenantId}`);
                if (res.data.campaign) {
                    setCampaign(res.data.campaign);
                    // Set initial default for selected action type
                    const defaultRewards = (res.data.campaign.defaultSpinRewards as any) || {};
                    const defaultForAction = defaultRewards[formData.actionType] || 1;
                    setFormData(prev => ({ ...prev, spinsReward: defaultForAction }));
                }
            } catch (error) {
                console.error('Error fetching campaign:', error);
            }
        };
        if (campaignId) {
            fetchCampaign();
        }
    }, [campaignId, tenantId]);

    // Update spinsReward when actionType changes
    useEffect(() => {
        if (campaign?.defaultSpinRewards) {
            const defaultRewards = campaign.defaultSpinRewards as any;
            const defaultForAction = defaultRewards[formData.actionType] || 1;
            setFormData(prev => ({ ...prev, spinsReward: defaultForAction }));
        }
    }, [formData.actionType, campaign]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/api/admin/social-tasks', {
                ...formData,
                campaignId,
                tenantId,
            });
            alert('Social task created successfully!');
            setShowCreateForm(false);
            setFormData({
                platform: 'FACEBOOK',
                actionType: 'VISIT_PAGE', // Default to new policy-compliant type
                title: '',
                targetUrl: '',
                spinsReward: 1,
                displayOrder: 0,
            });
            onRefresh();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create social task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this social task?')) return;
        try {
            await axios.delete('/api/admin/social-tasks', {
                data: { taskId, tenantId },
            });
            alert('Social task deleted successfully!');
            onRefresh();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete social task');
        }
    };

    if (!subscriptionPlan || !subscriptionPlan.socialMediaEnabled) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-amber-500 mb-4">Social Media Tasks Not Available</h2>
                        <p className="text-slate-400 mb-6">
                            Social media tasks are only available on Starter, Pro, or Enterprise plans.
                            Please upgrade your plan to use this feature.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-purple-500">Social Media Tasks</h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Manage social tasks for this campaign ({tasks.length}/{subscriptionPlan.maxSocialTasks} used)
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {tasks.length >= subscriptionPlan.maxSocialTasks && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-3 rounded-lg mb-6 text-sm">
                        Task limit reached. Your plan allows {subscriptionPlan.maxSocialTasks} social task(s).
                    </div>
                )}

                {!showCreateForm && tasks.length < subscriptionPlan.maxSocialTasks && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="mb-6 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
                    >
                        + Create Social Task
                    </button>
                )}

                {showCreateForm && (
                    <form onSubmit={handleSubmit} className="mb-6 bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold mb-4">Create New Social Task</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Platform</label>
                                    <select
                                        value={formData.platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        required
                                    >
                                        <option value="FACEBOOK">Facebook</option>
                                        <option value="INSTAGRAM">Instagram</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Action Type</label>
                                    <select
                                        value={formData.actionType}
                                        onChange={(e) => {
                                            const newActionType = e.target.value;
                                            // Get default spin reward for this action type
                                            const defaultRewards = (campaign?.defaultSpinRewards as any) || {};
                                            const defaultForAction = defaultRewards[newActionType] || 1;
                                            setFormData({ ...formData, actionType: newActionType, spinsReward: defaultForAction });
                                        }}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        required
                                    >
                                        {/* New policy-compliant VISIT action types */}
                                        <option value="VISIT_PAGE">Visit Page</option>
                                        <option value="VISIT_PROFILE">Visit Profile</option>
                                        <option value="VIEW_POST">View Post</option>
                                        <option value="VIEW_DISCUSSION">View Discussion</option>
                                        <option value="VISIT_TO_SHARE">Visit to Share</option>
                                        {/* Legacy action types (deprecated, hidden but kept for backward compatibility) */}
                                        {/* LIKE_PAGE is hidden - use VISIT_PAGE instead */}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    placeholder="Follow us on Facebook"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Target URL</label>
                                <input
                                    type="url"
                                    value={formData.targetUrl}
                                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    placeholder="https://facebook.com/yourpage"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Spins Reward</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.spinsReward}
                                        onChange={(e) => setFormData({ ...formData, spinsReward: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                                        placeholder="Enter number of spins (e.g., 1, 5, 10, 50)"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        {campaign?.defaultSpinRewards && (campaign.defaultSpinRewards as any)[formData.actionType] 
                                            ? `Default: ${(campaign.defaultSpinRewards as any)[formData.actionType]} spins (from campaign settings)`
                                            : 'You can set any number of spins to reward'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Task'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        No social tasks yet. Create your first task to get started!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div key={task.id} className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-bold ${
                                                    task.platform === 'FACEBOOK'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                }`}
                                            >
                                                {task.platform}
                                            </span>
                                            <span className="text-xs text-slate-400 uppercase">
                                                {formatActionTypeForDisplay(task.actionType)}
                                            </span>
                                            <span className="text-xs text-amber-500 font-bold">
                                                {task.spinsReward} spin(s)
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-white mb-1">{task.title}</h4>
                                        <p className="text-sm text-slate-400 break-all">{task.targetUrl}</p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Completions: {task._count?.completions || 0}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="text-red-500 hover:text-red-400 text-sm font-bold ml-4"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Analytics Tab Component
function AnalyticsTab({ tenantId }: { tenantId: string }) {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAnalytics();
    }, [startDate, endDate]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/admin/analytics?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}`);
            setAnalytics(res.data);
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            alert(err.response?.data?.error || 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-400">Loading analytics...</div>;
    }

    if (!analytics) {
        return <div className="text-center py-12 text-slate-400">No analytics data available</div>;
    }

    return (
        <div className="space-y-6">
            {/* Date Range Picker */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Date Range</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {[
                    { label: 'Total Spins', value: analytics.kpis.totalSpins, icon: '🎡', color: 'text-amber-500' },
                    { label: 'Total Users', value: analytics.kpis.totalUsers, icon: '👥', color: 'text-blue-500' },
                    { label: 'Prizes Won', value: analytics.kpis.prizesWon, icon: '🏆', color: 'text-green-500' },
                    { label: 'Conversion Rate', value: `${analytics.kpis.conversionRate}%`, icon: '📈', color: 'text-purple-500' },
                    { label: 'Referral Spins', value: analytics.kpis.referralSpins, icon: '🎁', color: 'text-pink-500' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <div className="text-3xl mb-2">{kpi.icon}</div>
                        <div className="text-slate-400 text-xs font-medium uppercase mb-1">{kpi.label}</div>
                        <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Daily Spins</h3>
                    <div className="space-y-2">
                        {analytics.charts?.dailySpins && analytics.charts.dailySpins.length > 0 ? (
                            (() => {
                                const recentData = analytics.charts.dailySpins.slice(-7);
                                const maxSpins = Math.max(...recentData.map((d: any) => d.spins || 0), 1);
                                return recentData.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">{item.date}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-32 bg-slate-800 rounded-full h-2">
                                                <div
                                                    className="bg-amber-500 h-2 rounded-full"
                                                    style={{ width: `${((item.spins || 0) / maxSpins) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-white w-8 text-right">{item.spins || 0}</span>
                                        </div>
                                    </div>
                                ));
                            })()
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">No spin data available for this period</div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Prize Distribution</h3>
                    <div className="space-y-2">
                        {analytics.charts?.prizeDistribution && analytics.charts.prizeDistribution.length > 0 ? (
                            analytics.charts.prizeDistribution.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400 truncate flex-1">{item.prizeName || 'Unknown'}</span>
                                    <span className="text-sm font-bold text-white ml-2">{item.count || 0}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">No prize distribution data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Referrers */}
            {analytics.topReferrers && analytics.topReferrers.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Top Referrers</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                                    <th className="pb-4 font-bold">Name</th>
                                    <th className="pb-4 font-bold">Phone</th>
                                    <th className="pb-4 font-bold">Successful Referrals</th>
                                    <th className="pb-4 font-bold">Referral Code</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {analytics.topReferrers.map((referrer: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-800/30">
                                        <td className="py-4 font-bold">{referrer.name || 'Anonymous'}</td>
                                        <td className="py-4 text-slate-400">{referrer.phone}</td>
                                        <td className="py-4">{referrer.successfulReferrals}</td>
                                        <td className="py-4 font-mono text-sm text-amber-500">{referrer.referralCode}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Change Password Modal Component
function ChangePasswordModal({ adminId, isSuperAdmin, onClose }: { adminId: string; isSuperAdmin: boolean; onClose: () => void }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await axios.put('/api/admin/profile/password', {
                adminId,
                isSuperAdmin,
                currentPassword,
                newPassword
            });
            alert('Password updated successfully!');
            onClose();
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-500">Change Password</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
