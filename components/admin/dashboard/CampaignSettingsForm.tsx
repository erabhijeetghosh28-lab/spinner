import ImageUploader from '@/components/admin/ImageUploader';

interface Campaign {
    spinLimit: number;
    spinCooldown: number;
    referralsRequiredForSpin: number;
    logoUrl?: string;
    supportMobile?: string;
    websiteUrl?: string;
    templateId?: string;
    defaultSpinRewards?: Record<string, number>;
}

interface CampaignSettingsFormProps {
    campaign: Campaign;
    setCampaign: (c: any) => void;
    templates: any[];
    campaignId?: string | null;
}

export function CampaignSettingsForm({
    campaign,
    setCampaign,
    templates,
    campaignId
}: CampaignSettingsFormProps) {
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
