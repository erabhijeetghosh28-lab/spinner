'use client';

import AdminNav from '@/components/admin/AdminNav';
import { HeatmapChart } from '@/components/admin/analytics/HeatmapChart';
import { MissingVIPsTable } from '@/components/admin/analytics/MissingVIPsTable';
import { PrizeIntegrityChart } from '@/components/admin/analytics/PrizeIntegrityChart';
import { RedemptionFunnel } from '@/components/admin/analytics/RedemptionFunnel';
import { RedemptionTimeChart } from '@/components/admin/analytics/RedemptionTimeChart';
import { ReferralGrowthChart } from '@/components/admin/analytics/ReferralGrowthChart';
import { RetentionChart } from '@/components/admin/analytics/RetentionChart';
import { ROISimulator } from '@/components/admin/analytics/ROISimulator';
import { ViralGenome } from '@/components/admin/analytics/ViralGenome';
import { BrandedQRGenerator } from '@/components/admin/BrandedQRGenerator';
import { CampaignSettingsForm } from '@/components/admin/dashboard/CampaignSettingsForm';
import { CampaignWizardModal } from '@/components/admin/dashboard/CampaignWizardModal';
import { PrizeTable } from '@/components/admin/dashboard/PrizeTable';
import LandingPageBuilder from '@/components/admin/LandingPageBuilder';
import { UsageStats } from '@/components/admin/UsageStats';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';

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
    const [showBrandedQRModal, setShowBrandedQRModal] = useState<boolean>(false);
    const [brandedQRCampaign, setBrandedQRCampaign] = useState<{id: string, name: string} | null>(null);
    // Feature preview on hover
    const [hoverPreviewFeature, setHoverPreviewFeature] = useState<any>(null);
    const [showFeaturePreviewModal, setShowFeaturePreviewModal] = useState(false);
    // hover timer removed — modal will open on click instead of hover

    // Debug log to verify state initialization
    useEffect(() => {
        console.log('AdminDashboard mounted, showBrandedQRModal:', showBrandedQRModal);
    }, []);

    
    // Wizard Modal State
    const [showWizardModal, setShowWizardModal] = useState(false);
    const [editingWizardCampaign, setEditingWizardCampaign] = useState<any>(null);

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

        // Do not call fetchData here; fetchData will be triggered once tenantId is set
    }, []);

    // Fetch data when tenantId or campaign selection changes
    useEffect(() => {
        if (!tenantId) return;
        fetchData();
    }, [tenantId, campaignId]);

    // Track previous active tab to handle analytics -> overview transition
    const prevActiveTab = useRef<string | null>(null);

    useEffect(() => {
        if (activeTab === 'overview' && prevActiveTab.current === 'analytics') {
            // If analytics had 'All campaigns' selected (campaignId === '' or null), set recent campaign
            if (campaignId === '' || campaignId === null) {
                const recent = campaigns && campaigns.length > 0 ? campaigns[0].id : null;
                if (recent) setCampaignId(recent);
            }
        }
        prevActiveTab.current = activeTab;
    }, [activeTab, campaignId, campaigns]);

    const fetchData = async () => {
        const storedTenantId = tenantId || localStorage.getItem('admin-tenant-id');
        if (!storedTenantId) {
            console.error('No tenant ID found');
            setLoading(false);
            return;
        }

        // Helper to safely call endpoints and return null on failure
        const safeGet = async (url: string) => {
            try {
                const res = await axios.get(url);
                return res;
            } catch (error: any) {
                console.warn(`Request to ${url} failed:`, error.response?.status, error.response?.data || error.message);
                return null;
            }
        };

        try {
            // Fetch templates for theme selector
            const templatesRes = await safeGet('/api/admin/super/templates');
            if (templatesRes?.data?.templates) {
                setTemplates(templatesRes.data.templates.filter((t: any) => t.isActive));
            } else {
                setTemplates([]);
            }

            // Fetch all campaigns for tenant (including archived)
            const campaignsRes = await safeGet(`/api/admin/campaigns?tenantId=${storedTenantId}&includeArchived=true`);
            const allCampaigns = campaignsRes?.data?.campaigns || [];
            setCampaigns(allCampaigns);

            // Set plan info with debugging and normalization
            const planData = campaignsRes?.data?.plan;
            console.log('📊 Plan Info from API:', planData);
            const normalizedPlanInfo = planData ? {
                ...planData,
                allowAnalytics: Boolean(planData.allowAnalytics),
                allowQRCodeGenerator: Boolean(planData.allowQRCodeGenerator),
                allowInventoryTracking: Boolean(planData.allowInventoryTracking)
            } : null;
            setPlanInfo(normalizedPlanInfo);

            // Determine which campaign to use: prefer selected campaignId state, else fetch active campaign
            let currentCampaignId: string | null = null;
            if (campaignId) {
                currentCampaignId = campaignId;
                // If campaignId chosen, try to set tenantSlug and campaign settings from the freshly fetched campaigns list
                const selected = (allCampaigns || []).find((c: any) => c.id === campaignId);
                if (selected) {
                    setTenantSlug(selected.tenant?.slug || selected.tenantSlug || selected.slug || '');
                    setCampaign({
                        spinLimit: selected.spinLimit || 1,
                        spinCooldown: selected.spinCooldown || 24,
                        referralsRequiredForSpin: selected.referralsRequiredForSpin || 0,
                        logoUrl: selected.logoUrl || '',
                        templateId: selected.templateId || '',
                        supportMobile: selected.supportMobile || '',
                        websiteUrl: selected.websiteUrl || '',
                        defaultSpinRewards: selected.defaultSpinRewards || {}
                    });
                } else {
                    // fallback: fetch campaign details
                    const campaignRes = await safeGet(`/api/admin/campaign?tenantId=${storedTenantId}`);
                    if (campaignRes?.data?.campaign) {
                        const camp = campaignRes.data.campaign;
                        setTenantSlug(camp.tenantSlug || camp.tenant?.slug || '');
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
                }
            } else {
                const campaignRes = await safeGet(`/api/admin/campaign?tenantId=${storedTenantId}`);
                if (campaignRes?.data?.campaign) {
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
                } else {
                    // No active campaign found - keep prizes empty
                    setPrizes([]);
                }
            }

            // Fetch prizes for selected/current campaign (if any)
            if (currentCampaignId) {
                const prizesRes = await safeGet(`/api/admin/prizes?campaignId=${currentCampaignId}&tenantId=${storedTenantId}`);
                setPrizes(prizesRes?.data?.prizes || []);
            } else {
                setPrizes([]);
            }

            // Fetch stats (tenant-scoped) — include campaign filter if selected
            const statsUrl = `/api/admin/stats?tenantId=${storedTenantId}${currentCampaignId ? `&campaignId=${currentCampaignId}` : ''}`;
            const statsRes = await safeGet(statsUrl);
            if (statsRes?.data) setStats(statsRes.data);
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
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <AdminNav />
            
            <div className="p-4 md:p-8 lg:p-12">
            <div className="max-w-[1600px] mx-auto">

                {/* Tabs - Always Visible */}
                <div className="bg-slate-900 border-b border-slate-800 mb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 flex items-center space-x-1 overflow-x-auto no-scrollbar whitespace-nowrap">
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

                            {/* Campaign selector in nav bar (All option only for Analytics) */}
                            {campaigns.length > 1 && (
                                <div className="hidden md:flex items-center space-x-3">
                                    <label htmlFor="campaignSelect" className="text-sm text-slate-400">Campaign:</label>
                            <div className="flex items-center space-x-3">
                                <select
                                    id="campaignSelect"
                                    value={campaignId ?? ''}
                                    onChange={(e) => setCampaignId(e.target.value || null)}
                                    className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
                                >
                                    {activeTab === 'analytics' && <option value="">All campaigns</option>}
                                    {campaigns.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {/* Campaign status badge */}
                                {campaignId && (() => {
                                    const sel = campaigns.find((c: any) => c.id === campaignId);
                                    if (!sel) return null;
                                    return (
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sel.isArchived ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-green-500/10 text-green-300 border border-green-500/30'}`}>
                                            {sel.isArchived ? 'Archived' : 'Active'}
                                        </span>
                                    );
                                })()}
                            </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Tab Content */}
                {activeTab === 'overview' && (
                    !campaignId ? (
                            /* Empty State - No Active Campaign */
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <span className="text-6xl">🎡</span>
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Your Campaign Manager</h1>
                            <p className="text-slate-400 text-lg max-w-2xl mb-10">
                                {campaigns.length > 0 
                                    ? "You don't have any active campaigns running. Create a new one or restore an archived campaign to get started."
                                    : "It looks like you haven't created any campaigns yet. Setup your first Spin & Win campaign in minutes to start engaging your customers."}
                            </p>
                            {/* Feature Availability */}
                            <div className="mt-6 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { key: 'Campaigns', allowed: true, desc: 'Create and manage campaigns within your plan limits' },
                                    { key: 'QR Code Generator', allowed: true, desc: 'Generate QR codes & branded posters' },
                                    { key: 'Advanced Analytics', allowed: !!planInfo?.allowAnalytics, desc: 'Deep insights, referral charts & reports' },
                                    { key: 'Inventory Tracking', allowed: !!planInfo?.allowInventoryTracking, desc: 'Prize inventory & low-stock alerts' },
                                ].map((f) => (
                                    <div
                                        key={f.key}
                                        onClick={() => {
                                            setHoverPreviewFeature(f);
                                            setShowFeaturePreviewModal(true);
                                        }}
                                        className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/50 p-5 rounded-2xl border border-slate-700/60 shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start">
                                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${f.allowed ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {f.allowed ? '✓' : '🔒'}
                                            </div>
                                            <div className="ml-4">
                                                <div className={`text-sm font-semibold ${f.allowed ? 'text-white' : 'text-slate-300'}`}>{f.key}</div>
                                                <div className="text-xs text-slate-400 mt-1 max-w-[12rem]">{f.desc}</div>
                                            </div>
                                            {!f.allowed && (
                                                <div className="ml-auto self-center">
                                                    <a
                                                        href="/admin/billing/upgrade"
                                                        className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500 text-slate-900 rounded-full text-xs font-bold shadow-sm"
                                                    >
                                                        <span>Upgrade</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setEditingWizardCampaign(null);
                                    setShowWizardModal(true);
                                }}
                                className="mt-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-black px-10 py-5 rounded-2xl text-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                            >
                                + Create New Campaign
                            </button>
                            {/* Feature preview modal (opens on hover) */}
                            {showFeaturePreviewModal && hoverPreviewFeature && (
                                <div
                                    onClick={() => {
                                        setShowFeaturePreviewModal(false);
                                        setHoverPreviewFeature(null);
                                    }}
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
                                >
                                    <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{hoverPreviewFeature.key}</h3>
                                                <p className="text-sm text-slate-400 mt-1">{hoverPreviewFeature.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowFeaturePreviewModal(false);
                                                    setHoverPreviewFeature(null);
                                                }}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Mock content for each feature */}
                                            {hoverPreviewFeature.key === 'Campaigns' && (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-slate-400">Example</div>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="bg-indigo-700 text-white rounded-xl px-3 py-2">Active: 0</div>
                                                        <div className="bg-amber-600 text-slate-900 rounded-xl px-3 py-2">Create New</div>
                                                    </div>
                                                    <p className="text-sm text-slate-300 mt-2">Create campaigns, set prizes, schedule duration and launch directly.</p>
                                                </div>
                                            )}
                                            {hoverPreviewFeature.key === 'QR Code Generator' && (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-slate-400">Preview</div>
                                                    <div className="w-32 h-32 bg-white/5 rounded-lg flex items-center justify-center">QR</div>
                                                    <p className="text-sm text-slate-300 mt-2">Generate PNG QR codes and branded posters for print or social.</p>
                                                </div>
                                            )}
                                            {hoverPreviewFeature.key === 'Advanced Analytics' && (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-slate-400">Snapshot</div>
                                                    <div className="bg-slate-800 p-3 rounded-lg">
                                                        <div className="text-xs text-slate-400">Spins Today</div>
                                                        <div className="text-2xl font-bold text-amber-400">0</div>
                                                    </div>
                                                    <p className="text-sm text-slate-300 mt-2">View referral growth, conversion funnels and ROI simulations.</p>
                                                </div>
                                            )}
                                            {hoverPreviewFeature.key === 'Inventory Tracking' && (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-slate-400">Inventory</div>
                                                    <div className="bg-slate-800 p-3 rounded-lg">
                                                        <div className="text-sm text-slate-300">50% Off — Stock: 10</div>
                                                        <div className="text-sm text-slate-300">Free Gift — Stock: 0 (low)</div>
                                                    </div>
                                                    <p className="text-sm text-slate-300 mt-2">Track prize stock levels and receive low-stock alerts.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
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

                                    <div className="flex items-center space-x-2 bg-black/40 border border-slate-700 rounded-xl p-2 min-w-0">
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
                ))}

                {activeTab === 'campaigns' && tenantId && (
                    <CampaignsTab
                        campaigns={campaigns}
                        templates={templates}
                        planInfo={planInfo}
                        tenantId={tenantId}
                        tenantSlug={tenantSlug}
                        campaignId={campaignId}
                        onRefresh={fetchData}
                        onCreate={() => {
                            setEditingWizardCampaign(null);
                            setShowWizardModal(true);
                        }}
                        onEdit={(camp) => {
                            setEditingWizardCampaign(camp);
                            setShowWizardModal(true);
                        }}
                        onShowBrandedQR={(campaign) => {
                            console.log('onShowBrandedQR called with:', campaign);
                            setBrandedQRCampaign(campaign);
                            setShowBrandedQRModal(true);
                            console.log('showBrandedQRModal set to true');
                        }}
                    />
                )}

                {activeTab === 'analytics' && tenantId && planInfo?.allowAnalytics && (
                    <AnalyticsTab
                        tenantId={tenantId}
                        campaignId={campaignId}
                        campaigns={campaigns}
                        onCampaignChange={(id?: string | null) => setCampaignId(id || null)}
                    />
                )}
            </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && adminId && (
                <ChangePasswordModal
                    adminId={adminId}
                    isSuperAdmin={false}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}

            {/* Wizard Modal */}
            <CampaignWizardModal
                isOpen={showWizardModal}
                onClose={() => {
                    setShowWizardModal(false);
                    setEditingWizardCampaign(null);
                }}
                onSuccess={() => {
                    fetchData();
                    // Optionally switch to campaigns tab
                    // setActiveTab('campaigns');
                }}
                editingCampaign={editingWizardCampaign}
                tenantId={tenantId || ''}
                templates={templates}
                planInfo={planInfo}
            />

            {/* Branded QR Generator Modal */}
            {showBrandedQRModal && brandedQRCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-amber-500">Generate Branded QR Codes</h2>
                            <button 
                                onClick={() => setShowBrandedQRModal(false)} 
                                className="text-slate-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <BrandedQRGenerator 
                            campaignId={brandedQRCampaign.id}
                            campaignName={brandedQRCampaign.name}
                            tenantId={tenantId}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}




// Campaigns Tab Component
function CampaignsTab({ campaigns, templates, planInfo, tenantId, tenantSlug, campaignId, onRefresh, onCreate, onEdit, onShowBrandedQR }: {
    campaigns: any[];
    templates: any[];
    planInfo: any;
    tenantId: string;
    tenantSlug: string;
    campaignId?: string | null;
    onRefresh: () => void;
    onCreate: () => void;
    onEdit: (camp: any) => void;
    onShowBrandedQR: (campaign: {id: string, name: string}) => void;
}) {
    const [limitInfo, setLimitInfo] = useState<any>(null);
    const [loadingLimit, setLoadingLimit] = useState(false);
    const [showSocialTasksModal, setShowSocialTasksModal] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [socialTasks, setSocialTasks] = useState<any[]>([]);
    const [socialTasksLoading, setSocialTasksLoading] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
    const [landingPageStatus, setLandingPageStatus] = useState<Record<string, boolean>>({});
    const [showLandingPageBuilder, setShowLandingPageBuilder] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

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

    const displayedCampaigns = campaigns.filter(c => showArchived ? c.isArchived : !c.isArchived);

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

    const handleDelete = async (campaignId: string) => {
        if (!confirm('Are you sure you want to archive this campaign? It will be hidden from the UI and retained for 1 year before permanent deletion.')) return;

        try {
            if (!tenantId) {
                alert('Missing tenant information');
                return;
            }

            // Archive (soft-delete) the campaign instead of immediate permanent deletion
            await axios.patch(`/api/admin/campaigns/${campaignId}/archive`, { tenantId });
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
            {tenantId && <UsageStats tenantId={tenantId} campaignId={campaignId} />}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Campaigns</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={showArchived} 
                                onChange={(e) => setShowArchived(e.target.checked)}
                                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-slate-400 font-medium">Show Archived</span>
                        </label>
                        <button
                            onClick={onCreate}
                            disabled={limitInfo && !limitInfo.canCreate}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            + New Campaign
                        </button>
                    </div>
                </div>

                {limitInfo && !limitInfo.canCreate && !showArchived && (
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
                            {displayedCampaigns.map((camp) => {
                                const startDate = new Date(camp.startDate);
                                const endDate = new Date(camp.endDate);
                                const isActive = camp.isActive && startDate <= now && endDate >= now;
                                const isScheduled = startDate > now;
                                const isExpired = endDate < now;

                                return (
                                    <tr key={camp.id} className="hover:bg-slate-800/30">
                                        <td className="py-4 font-bold">
                                            {camp.name}
                                            {camp.isArchived && <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-normal uppercase">Archived</span>}
                                        </td>
                                        <td className="py-4 text-slate-400">{camp.template?.name || 'None'}</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                camp.isArchived 
                                                ? 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                                                : isActive
                                                    ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                                                    : isScheduled
                                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                                                        : isExpired
                                                            ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                                                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                                                }`}>
                                                {camp.isArchived ? 'Archived' : isActive ? 'Active' : isScheduled ? 'Scheduled' : isExpired ? 'Expired' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4">{camp._count?.prizes || 0}</td>
                                        <td className="py-4">{camp._count?.spins || 0}</td>
                                        <td className="py-4">
                                            <div className="flex items-center space-x-2">
                                                {!camp.isArchived && (
                                                    <>
                                                        <>
                                                            <button
                                                            onClick={async () => {
                                                                    try {
                                                                        const storedTenantId = localStorage.getItem('admin-tenant-id') || tenantId;
                                                                        const token = localStorage.getItem('admin-token');
                                                                        const qrUrl = `/api/admin/qr?tenantId=${storedTenantId}&campaignId=${camp.id}&format=png`;
                                                                        const response = await axios.get(qrUrl, {
                                                                            responseType: 'blob',
                                                                            headers: {
                                                                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                                                                ...(storedTenantId ? { 'x-tenant-id': storedTenantId } : {})
                                                                            }
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
                                                                title="Generate Simple QR Code"
                                                            >
                                                                QR
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    onShowBrandedQR({ id: camp.id, name: camp.name });
                                                                }}
                                                                className="text-green-500 hover:text-green-400 text-sm font-bold"
                                                                title="Generate Branded QR Poster/Card"
                                                            >
                                                                Branded
                                                            </button>
                                                        </>
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
                                                            onClick={() => onEdit(camp)}
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
                                                    </>
                                                )}
                                                {camp.isArchived && (
                                                     <button
                                                        onClick={() => onEdit(camp)}
                                                        className="text-slate-400 hover:text-white text-sm font-bold"
                                                        title="View Details"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {displayedCampaigns.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                             {showArchived ? 'No archived campaigns found.' : 'No active campaigns found. Create your first campaign to get started!'}
                        </div>
                    )}
                </div>
            </div>

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
                        <h2 className="text-2xl font-bold text-purple-500 mb-4">Social Media Tasks Not Available</h2>
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
function AnalyticsTab({ tenantId, campaignId, campaigns, onCampaignChange }: { tenantId: string, campaignId?: string | null, campaigns?: any[], onCampaignChange?: (id?: string|null)=>void }) {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    // User Report State
    const [userReport, setUserReport] = useState<any>(null);
    const [userReportLoading, setUserReportLoading] = useState(false);
    const [userReportPage, setUserReportPage] = useState(1);

    useEffect(() => {
        fetchAnalytics();
    }, [startDate, endDate, campaignId]);

    useEffect(() => {
        fetchUserReport();
    }, [userReportPage, campaignId]);

    const fetchUserReport = async () => {
        try {
            setUserReportLoading(true);
            const url = `/api/admin/analytics/users?tenantId=${tenantId}&page=${userReportPage}&limit=10${campaignId ? `&campaignId=${campaignId}` : ''}`;
            const res = await axios.get(url);
            setUserReport(res.data);
        } catch (err) {
            console.error('Error fetching user report:', err);
        } finally {
            setUserReportLoading(false);
        }
    };

    const handleExportReport = async () => {
        try {
            const exportUrl = `/api/admin/export/campaign-users?tenantId=${tenantId}${campaignId ? `&campaignId=${campaignId}` : ''}`;
            const response = await axios.get(exportUrl, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `campaign-users-report-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download report');
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const url = `/api/admin/analytics?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}${campaignId ? `&campaignId=${campaignId}` : ''}`;
            const res = await axios.get(url);
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
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header & Date Range */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div>
                    <h2 className="text-2xl font-black text-white">Campaign Intelligence</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Deep insights into user behavior, virality, and ROI.
                    </p>
                </div>
                <div className="flex space-x-2">
                    {/* Campaign selector (Analytics only) */}
                    <div className="flex items-center space-x-3 mr-2">
                        <label className="text-[10px] uppercase text-slate-500 mr-2">Campaign</label>
                        <select
                            value={campaignId ?? ''}
                            onChange={(e) => onCampaignChange?.(e.target.value || null)}
                            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
                        >
                            <option value="">All campaigns</option>
                            {campaigns?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                         <div className="text-[10px] uppercase text-slate-500 absolute -top-2 left-2 bg-slate-900 px-1 font-bold">Start</div>
                         <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                    <div className="relative">
                         <div className="text-[10px] uppercase text-slate-500 absolute -top-2 left-2 bg-slate-900 px-1 font-bold">End</div>
                         <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Spins', value: analytics.kpis.totalSpins, icon: '🎡', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
                    { label: 'Total Users', value: analytics.kpis.totalUsers, icon: '👥', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                    { label: 'Prizes Won', value: analytics.kpis.prizesWon, icon: '🏆', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
                    { label: 'Win Rate', value: `${analytics.kpis.conversionRate}%`, icon: '📈', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
                    { label: 'Viral Spins', value: analytics.kpis.referralSpins, icon: '🎁', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
                ].map((kpi, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${kpi.color} backdrop-blur-sm`}>
                        <div className="text-2xl mb-1">{kpi.icon}</div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{kpi.label}</div>
                        <div className="text-2xl font-black">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* ROW 1: Action Grid (Funnel + Retention) */}
            <div className="grid md:grid-cols-2 gap-6 h-full mb-6">
                <RedemptionFunnel data={analytics.charts?.redemptionFunnel || { spins: 0, wins: 0, vouchers: 0, redeemed: 0 }} />
                <RetentionChart data={analytics.charts?.retention || {}} />
            </div>

            {/* ROW 2: Detailed User Report (moved above Heatmap) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
               <div className="flex justify-between items-center mb-6">
                   <div>
                       <h3 className="text-lg font-bold text-white">Campaign Participants</h3>
                       <p className="text-slate-500 text-sm">
                           {campaignId ? `Detailed breakdown of user activity across ${campaigns?.find((c:any)=>c.id===campaignId)?.name || 'the selected campaign'}.` : 'Detailed breakdown of user activity across all campaigns.'}
                       </p>
                   </div>
                   <button 
                       onClick={handleExportReport}
                       className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-500 font-bold px-4 py-2 rounded-lg transition-colors text-sm"
                   >
                       <span>📥</span>
                       <span>Export CSV</span>
                   </button>
               </div>
               
               <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                           <tr>
                               <th className="px-4 py-3 rounded-l-lg">User</th>
                               <th className="px-4 py-3">Mobile</th>
                               <th className="px-4 py-3">Campaign</th>
                               <th className="px-4 py-3 text-center">Spins</th>
                               <th className="px-4 py-3 text-center">Referrals</th>
                               <th className="px-4 py-3 text-right rounded-r-lg">Last Active</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                           {userReportLoading ? (
                               <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading details...</td></tr>
                           ) : !userReport?.data?.length ? (
                               <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No participants found.</td></tr>
                           ) : (
                               userReport.data.map((row: any, i: number) => (
                                   <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                       <td className="px-4 py-3 font-medium text-white">{row.userName}</td>
                                       <td className="px-4 py-3 text-slate-400 font-mono text-xs">{row.userPhone}</td>
                                       <td className="px-4 py-3 text-indigo-400">{row.campaignName}</td>
                                       <td className="px-4 py-3 text-center font-bold text-amber-500">{row.spinCount}</td>
                                       <td className="px-4 py-3 text-center text-slate-400">{row.referralCount}</td>
                                       <td className="px-4 py-3 text-right text-slate-500 text-xs">
                                           {new Date(row.lastActive).toLocaleDateString()}
                                       </td>
                                   </tr>
                               ))
                           )}
                       </tbody>
                   </table>
               </div>
               
               {/* Pagination */}
               {userReport?.pagination && userReport.pagination.pages > 1 && (
                   <div className="flex justify-center items-center space-x-2 mt-6">
                       <button 
                           disabled={userReportPage === 1}
                           onClick={() => setUserReportPage(p => p - 1)}
                           className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 text-xs"
                       >
                           Previous
                       </button>
                       <span className="text-xs text-slate-500">
                           Page {userReportPage} of {userReport.pagination.pages}
                       </span>
                       <button 
                           disabled={userReportPage === userReport.pagination.pages}
                           onClick={() => setUserReportPage(p => p + 1)}
                           className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 text-xs"
                       >
                           Next
                       </button>
                   </div>
               )}
            </div>

            {/* ROW 3: Heatmap (Full Width) */}
            <HeatmapChart data={analytics.charts?.heatmap || {}} />

            

            {/* ROW 3: Viral Engine */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                     <ReferralGrowthChart 
                        data={analytics.charts?.referralGrowth || []} 
                        viralCoefficient={analytics.kpis.viralCoefficient}
                    />
                </div>
                 <div className="md:col-span-1">
                     <RedemptionTimeChart data={analytics.charts?.redemptionTime || {}} />
                 </div>
            </div>

            {/* ROW 4: Network Visualizer & ROI */}
            <div className="grid lg:grid-cols-2 gap-6">
                 <ViralGenome data={analytics.deepAnalysis?.viralGenome || []} />
                 <ROISimulator data={analytics.deepAnalysis?.roiData || { totalUsers: 0, totalRedemptions: 0, totalSpins: 0 }} />
            </div>

             {/* ROW 5: Audit & Action Lists */}
             <div className="grid lg:grid-cols-2 gap-6">
                <PrizeIntegrityChart data={analytics.charts?.prizeIntegrity || []} />
                <MissingVIPsTable data={analytics.deepAnalysis?.churnCandidates || []} />
             </div>

            {/* Detailed User Report moved above; original instance removed here */}
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
