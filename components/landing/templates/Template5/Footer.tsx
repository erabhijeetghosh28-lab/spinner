'use client';

const PLATFORM_BRAND = 'TheLeadSpin';

interface FooterProps {
    footer: any;
    campaign?: any;
    tenantSlug?: string;
}

export default function Template5Footer({ footer, campaign, tenantSlug }: FooterProps) {
    // Template 5 primary color from reference HTML (not used in footer, but kept for consistency)
    const primaryColor = '#FF0800';
    const currentYear = new Date().getFullYear();
    const rulesUrl = tenantSlug ? `/${tenantSlug}/rules` : footer?.rulesUrl || '#';

    return (
        <footer className="w-full py-16 px-6 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-template5-primary flex items-center justify-center text-white font-black text-xl">W</div>
                    <span className="font-black text-2xl tracking-tighter uppercase">{PLATFORM_BRAND}</span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    <div className="flex gap-10 text-gray-500 text-xs font-black uppercase tracking-widest">
                        {footer?.privacyPolicyUrl && <a href={footer.privacyPolicyUrl} className="hover:text-template5-primary transition-colors">Privacy</a>}
                        {footer?.termsUrl && <a href={footer.termsUrl} className="hover:text-template5-primary transition-colors">Terms</a>}
                        <a href={rulesUrl} className="hover:text-template5-primary transition-colors">Rules</a>
                    </div>
                    {(campaign?.supportMobile || campaign?.websiteUrl) && (
                        <div className="flex gap-6 text-xs text-gray-500 font-black uppercase tracking-widest">
                            {campaign?.supportMobile && (
                                <a 
                                    href={`https://wa.me/${campaign.supportMobile.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 hover:text-template5-primary transition-colors"
                                >
                                    <span>📱</span>
                                    <span>Support</span>
                                </a>
                            )}
                            {campaign?.websiteUrl && (
                                <a 
                                    href={campaign.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 hover:text-template5-primary transition-colors"
                                >
                                    <span>🌐</span>
                                    <span>Website</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© {currentYear} {PLATFORM_BRAND}. All rights reserved.</p>
            </div>
        </footer>
    );
}
