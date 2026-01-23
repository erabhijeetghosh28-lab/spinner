'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'plans'>('overview');
    const [stats, setStats] = useState<any>(null);
    const [tenants, setTenants] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('super-admin-token');
        const storedAdminData = localStorage.getItem('super-admin-data');
        if (!token) {
            router.push('/admin/super');
            return;
        }
        if (storedAdminData) {
            setAdminData(JSON.parse(storedAdminData));
        }

        // Set global axios headers for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, tenantsRes, plansRes, templatesRes] = await Promise.all([
                axios.get('/api/admin/super/stats'),
                axios.get('/api/admin/super/tenants'),
                axios.get('/api/admin/super/plans'),
                axios.get('/api/admin/super/templates'),
            ]);

            setStats(statsRes.data);
            setTenants(tenantsRes.data.tenants);
            setPlans(plansRes.data.plans);
            setTemplates(templatesRes.data.templates);
        } catch (err) {
            console.error('Failed to fetch data');
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
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-2xl font-black">
                            👑
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-amber-500">Super Admin Dashboard</h1>
                            <p className="text-slate-400 text-sm">Platform Management</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
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

            {/* Tabs */}
            <div className="bg-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex space-x-1">
                        {(['overview', 'tenants', 'plans'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
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
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'overview' && <OverviewTab stats={stats} />}
                {activeTab === 'tenants' && <TenantsTab tenants={tenants} onRefresh={fetchData} />}
                {activeTab === 'plans' && <PlansTab plans={plans} onRefresh={fetchData} />}
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && adminData && (
                <ChangePasswordModal
                    adminId={adminData.id}
                    isSuperAdmin={true}
                    onClose={() => setShowPasswordModal(false)}
                />
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

// Overview Tab Component
function OverviewTab({ stats }: { stats: any }) {
    if (!stats) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Tenants', value: stats.stats?.totalTenants || 0, icon: '🏢', color: 'text-blue-500' },
                    { label: 'Active Tenants', value: stats.stats?.activeTenants || 0, icon: '✅', color: 'text-green-500' },
                    { label: 'Total Users', value: stats.stats?.totalUsers || 0, icon: '👥', color: 'text-purple-500' },
                    { label: 'Spins Today', value: stats.stats?.spinsToday || 0, icon: '🎡', color: 'text-amber-500' },
                    { label: 'Total Campaigns', value: stats.stats?.totalCampaigns || 0, icon: '📢', color: 'text-indigo-500' },
                    { label: 'Active Campaigns', value: stats.stats?.activeCampaigns || 0, icon: '🔥', color: 'text-red-500' },
                    { label: 'Total Spins', value: stats.stats?.totalSpins || 0, icon: '🎯', color: 'text-pink-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-3xl">{stat.icon}</div>
                        </div>
                        <div className="text-slate-400 text-xs font-medium uppercase mb-1">{stat.label}</div>
                        <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Recent Tenants */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Recent Tenants</h2>
                <div className="space-y-4">
                    {stats.recentTenants?.map((tenant: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                            <div>
                                <div className="font-bold">{tenant.name}</div>
                                <div className="text-sm text-slate-400">{tenant.slug} • {tenant.plan.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">{tenant._count.campaigns} campaigns</div>
                                <div className="text-sm text-slate-400">{tenant._count.endUsers} users</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Tenants Tab Component
function TenantsTab({ tenants, onRefresh }: { tenants: any[]; onRefresh: () => void }) {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTenant, setDeletingTenant] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);
    const [editingTenant, setEditingTenant] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        contactPhone: '',
        planId: '',
        isActive: true,
        waApiUrl: '',
        waApiKey: '',
        waSender: '',
        tenantAdminPassword: ''
    });
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await axios.get('/api/admin/super/plans');
            setPlans(res.data.plans);
        } catch (err) {
            console.error('Failed to fetch plans');
        }
    };

    const handleOpenModal = (tenant?: any) => {
        if (tenant) {
            setEditingTenant(tenant);
            const waConfig = tenant.waConfig as any || {};
            setFormData({
                name: tenant.name,
                slug: tenant.slug,
                contactPhone: tenant.contactPhone || '',
                planId: tenant.planId,
                isActive: tenant.isActive,
                waApiUrl: waConfig.apiUrl || '',
                waApiKey: waConfig.apiKey || '',
                waSender: waConfig.sender || '',
                tenantAdminPassword: ''
            });
        } else {
            setEditingTenant(null);
            setFormData({
                name: '',
                slug: '',
                contactPhone: '',
                planId: plans[0]?.id || '',
                isActive: true,
                waApiUrl: '',
                waApiKey: '',
                waSender: '',
                tenantAdminPassword: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTenant(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Build waConfig object if any WA fields are filled
            const waConfig = (formData.waApiUrl || formData.waApiKey || formData.waSender) ? {
                apiUrl: formData.waApiUrl || undefined,
                apiKey: formData.waApiKey || undefined,
                sender: formData.waSender || undefined
            } : null;

            const submitData: any = {
                name: formData.name,
                slug: formData.slug,
                contactPhone: formData.contactPhone || null,
                planId: formData.planId,
                isActive: formData.isActive,
                waConfig: waConfig
            };

            // Only include password if editing and password is provided
            if (editingTenant && formData.tenantAdminPassword) {
                submitData.tenantAdminPassword = formData.tenantAdminPassword;
            }

            if (editingTenant) {
                await axios.put('/api/admin/super/tenants', {
                    id: editingTenant.id,
                    ...submitData
                });
            } else {
                await axios.post('/api/admin/super/tenants', submitData);
            }
            handleCloseModal();
            onRefresh();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save tenant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Tenants</h2>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold"
                    >
                        + New Tenant
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                                <th className="pb-4 font-bold">Name</th>
                                <th className="pb-4 font-bold">Slug</th>
                                <th className="pb-4 font-bold">Plan</th>
                                <th className="pb-4 font-bold">Status</th>
                                <th className="pb-4 font-bold">Campaigns</th>
                                <th className="pb-4 font-bold">Users</th>
                                <th className="pb-4 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-800/30">
                                    <td className="py-4 font-bold">{tenant.name}</td>
                                    <td className="py-4 text-slate-400 font-mono text-sm">{tenant.slug}</td>
                                    <td className="py-4">{tenant.plan.name}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${tenant.isActive
                                                ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                                                : 'bg-red-500/10 text-red-500 border border-red-500/30'
                                            }`}>
                                            {tenant.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-4">{tenant._count.campaigns}</td>
                                    <td className="py-4">{tenant._count.endUsers}</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleOpenModal(tenant)}
                                                className="text-amber-500 hover:text-amber-400 text-sm font-bold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeletingTenant(tenant);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="text-red-500 hover:text-red-400 text-sm font-bold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-red-500">
                                Delete Tenant
                            </h2>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletingTenant(null);
                                }}
                                className="text-slate-400 hover:text-white"
                                disabled={deleting}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-300">
                                Are you sure you want to delete <span className="font-bold text-white">{deletingTenant.name}</span>?
                            </p>
                            
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <p className="text-sm text-red-400 font-semibold mb-2">⚠️ Warning: This action cannot be undone!</p>
                                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                    <li>All campaigns ({deletingTenant._count?.campaigns || 0}) will be deleted</li>
                                    <li>All users ({deletingTenant._count?.endUsers || 0}) will be deleted</li>
                                    <li>All admin accounts will be deleted</li>
                                    <li>All usage data will be deleted</li>
                                    <li>All prizes, social tasks, and landing pages will be deleted</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={async () => {
                                        setDeleting(true);
                                        try {
                                            await axios.delete(`/api/admin/super/tenants?id=${deletingTenant.id}`);
                                            setShowDeleteModal(false);
                                            setDeletingTenant(null);
                                            onRefresh();
                                        } catch (err: any) {
                                            alert(err.response?.data?.error || 'Failed to delete tenant');
                                        } finally {
                                            setDeleting(false);
                                        }
                                    }}
                                    disabled={deleting}
                                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete Tenant'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletingTenant(null);
                                    }}
                                    disabled={deleting}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tenant Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-amber-500">
                                {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Tenant Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Slug (URL identifier)
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="my-tenant"
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">Used in URLs: ?tenant=slug</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Contact Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="919899011616"
                                />
                                <p className="text-xs text-slate-500 mt-1">Contact phone number for this tenant</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Subscription Plan
                                </label>
                                <select
                                    value={formData.planId}
                                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                >
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {plan.price ? `₹${plan.price}` : 'Free'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-slate-300">Active</span>
                                </label>
                            </div>

                            {/* WhatsApp Configuration Section */}
                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-lg font-bold text-amber-500 mb-4">WhatsApp Configuration (Optional)</h3>
                                <p className="text-xs text-slate-500 mb-4">Override global WhatsApp settings for this tenant. Leave empty to use global defaults.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                            WhatsApp API URL
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.waApiUrl}
                                            onChange={(e) => setFormData({ ...formData, waApiUrl: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="https://unofficial.cloudwapi.in/send-message"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                            WhatsApp API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.waApiKey}
                                            onChange={(e) => setFormData({ ...formData, waApiKey: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Your API Key"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                            Sender Device Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.waSender}
                                            onChange={(e) => setFormData({ ...formData, waSender: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="919899011616"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tenant Admin Password Reset (Only when editing) */}
                            {editingTenant && (
                                <div className="pt-6 border-t border-slate-800">
                                    <h3 className="text-lg font-bold text-amber-500 mb-4">Reset Tenant Admin Password</h3>
                                    <p className="text-xs text-slate-500 mb-4">Leave empty to keep current password. Enter new password to reset.</p>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                                            New Password (Optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.tenantAdminPassword}
                                            onChange={(e) => setFormData({ ...formData, tenantAdminPassword: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Leave empty to keep current password"
                                            minLength={6}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Minimum 6 characters. Leave empty to keep current password.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : editingTenant ? 'Update Tenant' : 'Create Tenant'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// Plans Tab Component
function PlansTab({ plans, onRefresh }: { plans: any[]; onRefresh: () => void }) {
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [planFormData, setPlanFormData] = useState({
        name: '',
        maxSpins: 1000,
        maxCampaigns: 1,
        waIntegrationEnabled: true,
        allowAnalytics: false,
        allowQRCodeGenerator: false,
        allowInventoryTracking: false,
        price: 0
    });

    const handleOpenPlanModal = (plan?: any) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanFormData({
                name: plan.name,
                maxSpins: plan.maxSpins,
                maxCampaigns: plan.maxCampaigns,
                waIntegrationEnabled: plan.waIntegrationEnabled,
                allowAnalytics: plan.allowAnalytics ?? false,
                allowQRCodeGenerator: plan.allowQRCodeGenerator ?? false,
                allowInventoryTracking: plan.allowInventoryTracking ?? false,
                price: plan.price || 0
            });
        } else {
            setEditingPlan(null);
            setPlanFormData({
                name: '',
                maxSpins: 1000,
                maxCampaigns: 1,
                waIntegrationEnabled: true,
                allowAnalytics: false,
                allowQRCodeGenerator: false,
                allowInventoryTracking: false,
                price: 0
            });
        }
        setShowPlanModal(true);
    };

    const handleClosePlanModal = () => {
        setShowPlanModal(false);
        setEditingPlan(null);
    };

    const handlePlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await axios.put('/api/admin/super/plans', {
                    id: editingPlan.id,
                    ...planFormData
                });
            } else {
                await axios.post('/api/admin/super/plans', planFormData);
            }
            handleClosePlanModal();
            onRefresh();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save plan');
        }
    };

    return (
        <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Subscription Plans</h2>
                    <button
                        onClick={() => handleOpenPlanModal()}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold"
                    >
                        + New Plan
                    </button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <div className="flex items-center space-x-2">
                                    <div className="text-2xl font-bold text-amber-500">
                                        {plan.price ? `₹${plan.price}` : 'Free'}
                                    </div>
                                    <button
                                        onClick={() => handleOpenPlanModal(plan)}
                                        className="text-amber-500 hover:text-amber-400 transition-colors p-1"
                                        title="Edit Plan"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Max Spins:</span>
                                    <span className="font-bold">{plan.maxSpins.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Max Campaigns:</span>
                                    <span className="font-bold">{plan.maxCampaigns}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">WA Integration:</span>
                                    <span className={plan.waIntegrationEnabled ? 'text-green-500' : 'text-red-500'}>
                                        {plan.waIntegrationEnabled ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-700">
                                    <span className="text-slate-400">Tenants:</span>
                                    <span className="font-bold ml-2">{plan._count.tenants}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-amber-500">
                                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                            </h2>
                            <button onClick={handleClosePlanModal} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handlePlanSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Plan Name</label>
                                <input
                                    type="text"
                                    value={planFormData.name}
                                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Max Spins</label>
                                    <input
                                        type="number"
                                        value={planFormData.maxSpins}
                                        onChange={(e) => setPlanFormData({ ...planFormData, maxSpins: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Max Campaigns</label>
                                    <input
                                        type="number"
                                        value={planFormData.maxCampaigns}
                                        onChange={(e) => setPlanFormData({ ...planFormData, maxCampaigns: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={planFormData.price}
                                    onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={planFormData.waIntegrationEnabled}
                                        onChange={(e) => setPlanFormData({ ...planFormData, waIntegrationEnabled: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-slate-300">WhatsApp Integration Enabled</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={planFormData.allowAnalytics}
                                        onChange={(e) => setPlanFormData({ ...planFormData, allowAnalytics: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-slate-300">Analytics Dashboard</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={planFormData.allowQRCodeGenerator}
                                        onChange={(e) => setPlanFormData({ ...planFormData, allowQRCodeGenerator: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-slate-300">QR Code Generator</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={planFormData.allowInventoryTracking}
                                        onChange={(e) => setPlanFormData({ ...planFormData, allowInventoryTracking: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-slate-300">Prize Inventory Tracking</span>
                                </label>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl"
                                >
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClosePlanModal}
                                    className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// Templates Tab Component
function TemplatesTab({ templates, onRefresh }: { templates: any[]; onRefresh: () => void }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Wheel Templates</h2>
                <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold">
                    + New Template
                </button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <div key={template.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold">{template.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${template.isActive
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/30'
                                }`}>
                                {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="text-sm text-slate-400 mb-4">
                            Component: <span className="font-mono text-white">{template.componentKey}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-700">
                            <span className="text-slate-400">Campaigns:</span>
                            <span className="font-bold ml-2">{template._count.campaigns}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
