'use client';

const PLATFORM_BRAND = 'SpinWheel';

interface FooterProps {
    footer: any;
    campaign?: any;
    tenantSlug?: string;
}

export default function Template3Footer({ footer, campaign, tenantSlug }: FooterProps) {
    // Template 3 primary color from reference HTML (not used in footer, but kept for consistency)
    const primaryColor = '#D4AF37';
    const currentYear = new Date().getFullYear();
    const rulesUrl = tenantSlug ? `/${tenantSlug}/rules` : footer?.rulesUrl || '#';

    return (
        <footer className="w-full py-16 px-6 bg-white dark:bg-background-dark border-t border-template3-beige-light dark:border-white/5">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="transition-transform hover:scale-105 active:scale-95">
                    <img 
                        src="/spinwheel-logo.svg" 
                        alt="SpinWheel" 
                        className="h-20 w-auto min-w-[150px] object-contain" 
                    />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    <div className="flex gap-10 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                        {footer?.privacyPolicyUrl && <a href={footer.privacyPolicyUrl} className="hover:text-template3-primary transition-colors">Privacy</a>}
                        {footer?.termsUrl && <a href={footer.termsUrl} className="hover:text-template3-primary transition-colors">Terms</a>}
                        <a href={rulesUrl} className="hover:text-template3-primary transition-colors">Protocol</a>
                    </div>
                    {(campaign?.supportMobile || campaign?.websiteUrl) && (
                        <div className="flex gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                            {campaign?.supportMobile && (
                                <a 
                                    href={`https://wa.me/${campaign.supportMobile.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 hover:text-template3-primary transition-colors"
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
                                    className="flex items-center gap-2 hover:text-template3-primary transition-colors"
                                >
                                    <span>🌐</span>
                                    <span>Website</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">© {currentYear} {PLATFORM_BRAND}. All rights reserved.</p>
            </div>
        </footer>
    );
}
