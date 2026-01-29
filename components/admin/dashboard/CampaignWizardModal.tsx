import axios from 'axios';
import React, { useEffect, useState } from 'react';
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
        isActive: true,
        defaultSpinRewards: {}
    });
    const [modalPrizes, setModalPrizes] = useState<any[]>([]);
    const [fetchingPrizes, setFetchingPrizes] = useState(false);
    const [loading, setLoading] = useState(false);

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
                    isActive: true,
                    defaultSpinRewards: {
                        VISIT_PAGE: 1,
                        VISIT_PROFILE: 1,
                        VIEW_POST: 1,
                        VIEW_DISCUSSION: 1,
                        VISIT_TO_SHARE: 1
                    }
                });
                // Initial default prizes for new campaign
                setModalPrizes([
                    { name: '10% Off', probability: 40, dailyLimit: 100, isActive: true, position: 0, colorCode: '#1E3A8A' },
                    { name: 'Free Gift', probability: 10, dailyLimit: 10, isActive: true, position: 1, colorCode: '#f59e0b' },
                    { name: 'Try Again', probability: 50, dailyLimit: 9999, isActive: true, position: 2, colorCode: '#1E3A8A' }
                ]);
            }
        }
    }, [isOpen, editingCampaign, tenantId, templates]);

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
        const newPrizes = modalPrizes.filter((_, i) => i !== idx);
        setModalPrizes(newPrizes);
    };

    const handleSubmit = async () => {
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

    const nextStep = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        // Validation logic
        if (step === 1) {
            if (!formData.name) {
                alert('Please enter a campaign name');
                return;
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-amber-500">
                            {editingCampaign ? 'Manage Campaign' : 'Create New Campaign'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Step {step} of 3: {
                            step === 1 ? 'Campaign Details' :
                            step === 2 ? 'Wheel & Prizes' :
                            'Settings & Launch'
                        }</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mb-8 flex-shrink-0 overflow-hidden">
                    <div 
                        className="bg-amber-500 h-full transition-all duration-300 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
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
                                />
                            )}
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
                </div>

                {/* Footer / Controls */}
                <div className="flex space-x-4 pt-8 mt-4 border-t border-slate-800 flex-shrink-0">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-widest text-sm"
                        >
                            Back
                        </button>
                    )}
                    
                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-amber-500/10 transition-all uppercase tracking-widest active:scale-[0.98]"
                        >
                            Next Step &rarr;
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-black py-4 rounded-xl disabled:opacity-50 shadow-lg shadow-amber-500/10 transition-all uppercase tracking-widest active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : editingCampaign ? 'Save All Changes' : 'Launch Campaign 🚀'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
