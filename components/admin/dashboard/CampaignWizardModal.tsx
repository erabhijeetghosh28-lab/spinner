import axios from 'axios';
import React, { useEffect, useState } from 'react';
import LandingPageBuilder from '@/components/admin/LandingPageBuilder';
import { CampaignSettingsForm } from './CampaignSettingsForm';
import { PrizeTable } from './PrizeTable';

interface CampaignWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingCampaign?: any | null;
    tenantId: string;
    templates: any[];
    planInfo: any;
}

export function CampaignWizardModal({
    isOpen,
    onClose,
    onSuccess,
    editingCampaign,
    tenantId,
    templates,
    planInfo
}: CampaignWizardModalProps) {
    const [step, setStep] = useState(1);
    const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
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
        socialMediaEnabled: false,
        maxSocialTasks: 0,
        isActive: true,
        defaultSpinRewards: {}
    });
    const [modalPrizes, setModalPrizes] = useState<any[]>([]);
    const [prizeErrors, setPrizeErrors] = useState<Record<number, { name?: string; couponCode?: string }>>({});
    const [fetchingPrizes, setFetchingPrizes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [landingPageConfig, setLandingPageConfig] = useState({
        title: '',
        template: 'template_1',
        brandColor: '#f59e0b',
        metaTitle: '',
        metaDescription: '',
        heroHeadline: '',
        heroSubheadline: '',
        heroButtonText: 'Spin Now',
        publishLandingPage: false
    });

    useEffect(() => {
        if (isOpen) {
            setStep(1); // Reset to step 1
            if (editingCampaign) {
                setFormData({
                    name: editingCampaign.name,
                    description: editingCampaign.description || '',
                    logoUrl: editingCampaign.logoUrl || '',
                    templateId: editingCampaign.templateId || '',
                    supportMobile: editingCampaign.supportMobile || '',
                    websiteUrl: editingCampaign.websiteUrl || '',
                    spinLimit: editingCampaign.spinLimit,
                    spinCooldown: editingCampaign.spinCooldown,
                    referralsRequiredForSpin: editingCampaign.referralsRequiredForSpin || 0,
                        socialMediaEnabled: editingCampaign.socialMediaEnabled || false,
                        maxSocialTasks: editingCampaign.maxSocialTasks || 0,
                    isActive: editingCampaign.isActive,
                    defaultSpinRewards: editingCampaign.defaultSpinRewards || {}
                });

                // Fetch prizes for this specific campaign
                setFetchingPrizes(true);
                axios.get(`/api/admin/prizes?campaignId=${editingCampaign.id}&tenantId=${tenantId}`)
                    .then(res => {
                        setModalPrizes(res.data.prizes || []);
                    })
                    .catch(error => {
                        console.error('Error fetching modal prizes:', error);
                        setModalPrizes([]);
                    })
                    .finally(() => {
                        setFetchingPrizes(false);
                    });
            } else {
                // For new campaigns we intentionally do NOT pre-populate campaigns/prizes.
                // Let the tenant/admin explicitly create campaign details to avoid surprise defaults.
                setFormData({
                    name: '',
                    description: '',
                    logoUrl: '',
                    templateId: '', // require user to choose template
                    supportMobile: '',
                    websiteUrl: '',
                    spinLimit: 1,
                    spinCooldown: 24,
                    referralsRequiredForSpin: 0,
                    socialMediaEnabled: false,
                    maxSocialTasks: 0,
                    isActive: true,
                    defaultSpinRewards: {
                        VISIT_PAGE: 1,
                        VISIT_PROFILE: 1,
                        VIEW_POST: 1,
                        VIEW_DISCUSSION: 1,
                        VISIT_TO_SHARE: 1
                    }
                });
                // Start with empty prizes; admin will add prize segments explicitly
                setModalPrizes([]);
            }
        }
    }, [isOpen, editingCampaign, tenantId, templates]);

    const updateModalPrize = (idx: number, field: string, value: any) => {
        const newPrizes = [...modalPrizes];
        newPrizes[idx][field] = value;
        setModalPrizes(newPrizes);

        // Re-validate duplicates for names and coupon codes
        const nameCounts: Record<string, number[]> = {};
        const couponCounts: Record<string, number[]> = {};
        newPrizes.forEach((p, i) => {
            const nameKey = (p.name || '').trim().toLowerCase();
            const couponKey = (p.couponCode || '').trim().toUpperCase();
            if (nameKey) {
                nameCounts[nameKey] = nameCounts[nameKey] || [];
                nameCounts[nameKey].push(i);
            }
            if (couponKey) {
                couponCounts[couponKey] = couponCounts[couponKey] || [];
                couponCounts[couponKey].push(i);
            }
        });

        const errors: Record<number, { name?: string; couponCode?: string }> = {};
        Object.entries(nameCounts).forEach(([key, idxs]) => {
            if (key !== '' && idxs.length > 1) {
                idxs.forEach((i) => {
                    errors[i] = { ...(errors[i] || {}), name: 'Duplicate offer name' };
                });
            }
        });
        Object.entries(couponCounts).forEach(([key, idxs]) => {
            if (key !== '' && idxs.length > 1) {
                idxs.forEach((i) => {
                    errors[i] = { ...(errors[i] || {}), couponCode: 'Duplicate coupon code' };
                });
            }
        });

        setPrizeErrors(errors);
    };

    const addModalPrize = () => {
        if (modalPrizes.length >= 10) return;
        // Ensure default name/coupon don't collide
        const baseName = 'New Offer';
        let name = baseName;
        let suffix = 1;
        const existingNames = modalPrizes.map(p => (p.name || '').trim().toLowerCase());
        while (existingNames.includes(name.toLowerCase())) {
            suffix += 1;
            name = `${baseName} ${suffix}`;
        }
        setModalPrizes([...modalPrizes, {
            name,
            probability: 10,
            dailyLimit: 50,
            isActive: true,
            position: modalPrizes.length,
            colorCode: modalPrizes.length % 2 === 0 ? '#1E3A8A' : '#f59e0b',
            couponCode: ''
        }]);
    };

    const handleModalDeletePrize = (idx: number) => {
        const newPrizes = modalPrizes.filter((_, i) => i !== idx);
        setModalPrizes(newPrizes);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Prevent submit if there are prize validation errors (duplicates)
            if (Object.keys(prizeErrors).length > 0) {
                alert('Please fix duplicate offer names or coupon codes highlighted below before continuing.');
                setLoading(false);
                return;
            }
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

            let createdCampaignId: string | undefined = editingCampaign?.id;

            if (editingCampaign) {
                await axios.put('/api/admin/campaigns', payload);
            } else {
                const res = await axios.post('/api/admin/campaigns', payload);
                // Support both shapes: { campaign } or { id }
                createdCampaignId = res.data?.campaign?.id || res.data?.id || createdCampaignId;
                // if created as part of wizard, store draft id
                if (!editingCampaign && createdCampaignId) {
                    setDraftCampaignId(createdCampaignId);
                }
            }

            // If landing page info provided, create/update landing page for this campaign
            if (createdCampaignId && (landingPageConfig.title || landingPageConfig.metaTitle || landingPageConfig.heroHeadline)) {
                try {
                    await axios.post('/api/admin/landing-page', {
                        campaignId: createdCampaignId,
                        tenantId,
                        title: landingPageConfig.title,
                        template: landingPageConfig.template,
                        brandColor: landingPageConfig.brandColor,
                        metaTitle: landingPageConfig.metaTitle,
                        metaDescription: landingPageConfig.metaDescription,
                        hero: {
                            headline: landingPageConfig.heroHeadline,
                            subheadline: landingPageConfig.heroSubheadline,
                            buttonText: landingPageConfig.heroButtonText
                        }
                    });

                    if (landingPageConfig.publishLandingPage) {
                        await axios.patch('/api/admin/landing-page', {
                            campaignId: createdCampaignId,
                            tenantId,
                            isPublished: true
                        });
                    }
                } catch (lpErr: any) {
                    console.warn('Landing page creation failed:', lpErr.response?.data || lpErr.message);
                    // don't block campaign creation — show a friendly warning
                    alert('Campaign created but landing page setup failed. You can configure it later from Landing Page Builder.');
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to save campaign';
            console.error('Campaign save error:', err);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

// Social Tasks Editor (inline simplified version)
function SocialTasksEditor({ tenantId, campaignId }: { tenantId: string; campaignId?: string | null }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ platform: 'FACEBOOK', actionType: 'VISIT_PAGE', title: '', targetUrl: '', spinsReward: 1 });

    useEffect(() => {
        if (campaignId) fetch();
    }, [campaignId]);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/social-tasks?campaignId=${campaignId}&tenantId=${tenantId}`);
            setTasks(res.data.tasks || []);
        } catch (err) {
            console.error('Error fetching social tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const create = async () => {
        try {
            await axios.post('/api/admin/social-tasks', { ...form, campaignId, tenantId });
            setShowForm(false);
            fetch();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create social task');
        }
    };

    const remove = async (id: string) => {
        if (!confirm('Delete this social task?')) return;
        try {
            await axios.delete('/api/admin/social-tasks', { data: { taskId: id, tenantId } });
            fetch();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete social task');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white">Social Media Tasks</h4>
                {!showForm && <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">+ Create Social Task</button>}
            </div>
            {showForm && (
                <div className="bg-slate-800 p-4 rounded mb-4">
                    <div className="grid md:grid-cols-2 gap-3">
                        <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Title" className="p-2 bg-slate-700 rounded" />
                        <input value={form.targetUrl} onChange={(e)=>setForm({...form,targetUrl:e.target.value})} placeholder="Target URL" className="p-2 bg-slate-700 rounded" />
                        <select value={form.platform} onChange={(e)=>setForm({...form,platform:e.target.value})} className="p-2 bg-slate-700 rounded">
                            <option>FACEBOOK</option>
                            <option>INSTAGRAM</option>
                        </select>
                        <input type="number" value={form.spinsReward} onChange={(e)=>setForm({...form,spinsReward:parseInt(e.target.value)||1})} className="p-2 bg-slate-700 rounded" />
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button onClick={create} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                        <button onClick={()=>setShowForm(false)} className="px-4 py-2 bg-slate-700 text-white rounded">Cancel</button>
                    </div>
                </div>
            )}
            <div>
                {loading ? <div className="text-slate-400">Loading...</div> : tasks.length === 0 ? <div className="text-slate-500">No social tasks yet.</div> : (
                    <div className="space-y-2">
                        {tasks.map((t:any)=>(
                            <div key={t.id} className="bg-slate-800 p-3 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-white">{t.title}</div>
                                    <div className="text-xs text-slate-400">{t.platform} • {t.actionType}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={()=>remove(t.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

    const nextStep = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        // Validation logic
        if (step === 1) {
            if (!formData.name) {
                alert('Please enter a campaign name');
                return;
            }
        }
        // When moving from Prizes (step 2) ensure at least 5 offers and no validation errors
        if (step === 2) {
            if (Object.keys(prizeErrors).length > 0) {
                alert('Please fix duplicate offer names or coupon codes highlighted below before continuing.');
                return;
            }
            if (modalPrizes.length < 5) {
                alert(`Please add at least 5 offers before proceeding. You currently have ${modalPrizes.length}. Also note: use the "Try Again" checkbox per offer to show a temporary "Sorry, try again" message when the wheel lands on that segment.`);
                return;
            }
        }
        // When moving from Settings (step 3) to Social Tasks (step 4), ensure a campaign exists (create draft)
        if (step === 3) {
            if (!editingCampaign && !draftCampaignId) {
                // create a lightweight draft campaign to attach social tasks to
                    try {
                    const res = await axios.post('/api/admin/campaigns', {
                        tenantId,
                        name: formData.name || `Draft ${Date.now()}`,
                        description: formData.description || '',
                        templateId: formData.templateId || '',
                        supportMobile: formData.supportMobile || '',
                        websiteUrl: formData.websiteUrl || '',
                        spinLimit: formData.spinLimit || 1,
                        spinCooldown: formData.spinCooldown || 24,
                        referralsRequiredForSpin: formData.referralsRequiredForSpin || 0,
                        isActive: false, // create as draft by default
                        prizes: [], // no prizes yet
                    });
                    const newId = res.data?.campaign?.id || res.data?.id;
                    if (newId) {
                        setDraftCampaignId(newId);
                    } else {
                        alert('Failed to create draft campaign to attach social tasks. Try saving campaign first.');
                        return;
                    }
                } catch (err: any) {
                    console.error('Draft campaign creation failed:', err);
                    alert(err.response?.data?.error || 'Failed to create draft campaign for social tasks.');
                    return;
                }
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const confirmCancel = () => {
        // If user has entered data, confirm before closing
        const hasTyped = Boolean(formData.name || formData.description || modalPrizes.length > 0);
        if (!hasTyped) {
            onClose();
            return;
        }
        if (confirm('Discard changes and close the wizard?')) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-amber-500">
                            {editingCampaign ? 'Manage Campaign' : 'Create New Campaign'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Step {step} of 5: {
                            step === 1 ? 'Campaign Details' :
                            step === 2 ? 'Wheel & Prizes' :
                            step === 3 ? 'Settings & Launch' :
                            step === 4 ? 'Social Tasks' :
                            'Landing Page'
                        }</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mb-8 flex-shrink-0 overflow-hidden">
                <div
                    className="bg-amber-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${(step / 5) * 100}%` }}
                />
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 animate-fadeIn">
                            <h3 className="text-lg font-bold mb-6 flex items-center">
                                <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                                Basic Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Campaign Name <span className="text-red-500">*</span></label>
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
                    )}

                    {/* Step 2: Prizes */}
                    {step === 2 && (
                        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 animate-fadeIn">
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
                                    errors={prizeErrors}
                                />
                            )}
                            <div className="mt-4 text-sm">
                                <p className={`text-slate-400 ${modalPrizes.length < 5 ? 'text-red-400' : 'text-slate-400'}`}>
                                    Offers added: <span className="font-bold text-white">{modalPrizes.length}</span>. You must add at least <span className="font-bold">5 offers</span> to proceed.
                                </p>
                                <p className="text-[11px] text-slate-500 mt-2">
                                    Tip: The "Try Again" setting (column) displays a short "Sorry, try again" message for that segment when a user lands on it — useful for placeholder/waitlist offers. Toggle it per offer as needed.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Behavior & Branding */}
                    {step === 3 && (
                        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 animate-fadeIn">
                            <h3 className="text-lg font-bold mb-6 flex items-center">
                                <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                                Behavior & Branding
                            </h3>
                            <CampaignSettingsForm
                                campaign={formData as any}
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
                    )}
                    {/* Step 4: Social Tasks */}
                    {step === 4 && (
                        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 animate-fadeIn">
                            <h3 className="text-lg font-bold mb-6 flex items-center">
                                <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">4</span>
                                Social Media Tasks
                            </h3>
                            <SocialTasksEditor
                                tenantId={tenantId}
                                campaignId={editingCampaign?.id || draftCampaignId}
                            />
                        </div>
                    )}

                    {/* Step 5: Landing Page Setup */}
                    {step === 5 && (
                        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 animate-fadeIn">
                            <h3 className="text-lg font-bold mb-6 flex items-center">
                                <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">4</span>
                                Landing Page
                            </h3>
                            {/* Embedded Landing Page Builder */}
                            <div>
                                { (editingCampaign?.id || draftCampaignId) ? (
                                    <LandingPageBuilder
                                        campaignId={editingCampaign?.id || draftCampaignId || ''}
                                        tenantId={tenantId}
                                        onClose={() => {}}
                                        embed={true}
                                    />
                                ) : (
                                    <div className="bg-slate-800 p-6 rounded-lg">
                                        <p className="text-slate-300 mb-4">To configure the landing page, save a draft campaign first so we can attach the page to it.</p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                const res = await axios.post('/api/admin/campaigns', {
                                                        tenantId,
                                                        name: formData.name || `Draft ${Date.now()}`,
                                                        description: formData.description || '',
                                                        templateId: formData.templateId || '',
                                                        supportMobile: formData.supportMobile || '',
                                                        websiteUrl: formData.websiteUrl || '',
                                                        spinLimit: formData.spinLimit || 1,
                                                        spinCooldown: formData.spinCooldown || 24,
                                                        referralsRequiredForSpin: formData.referralsRequiredForSpin || 0,
                                                        isActive: false, // create as draft by default
                                                        prizes: [],
                                                    });
                                                    const newId = res.data?.campaign?.id || res.data?.id;
                                                    if (newId) {
                                                        setDraftCampaignId(newId);
                                                        alert('Draft campaign created — you can now configure the landing page.');
                                                    } else {
                                                        alert('Failed to create draft campaign. Please save campaign first.');
                                                    }
                                                } catch (err: any) {
                                                    console.error('Draft creation failed:', err);
                                                    alert(err.response?.data?.error || 'Failed to create draft campaign');
                                                }
                                            }}
                                            className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-bold"
                                        >
                                            Create Draft Campaign
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Controls */}
                <div className="flex items-center pt-8 mt-4 border-t border-slate-800 flex-shrink-0">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-widest text-sm"
                        >
                            Back
                        </button>
                    )}

                    {step < 5 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex-1 mx-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-amber-500/10 transition-all uppercase tracking-widest active:scale-[0.98]"
                        >
                            Next Step &rarr;
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 mx-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-black py-4 rounded-xl disabled:opacity-50 shadow-lg shadow-amber-500/10 transition-all uppercase tracking-widest active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : editingCampaign ? 'Save All Changes' : 'Launch Campaign 🚀'}
                        </button>
                    )}

                    {/* Cancel button on right side */}
                    <button
                        type="button"
                        onClick={confirmCancel}
                        className="ml-4 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-widest text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
