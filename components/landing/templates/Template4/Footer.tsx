'use client';

const PLATFORM_BRAND = 'SpinWheel';

interface FooterProps {
    footer: any;
    campaign?: any;
    tenantSlug?: string;
}

export default function Template4Footer({ footer, campaign, tenantSlug }: FooterProps) {
    // Template 4 primary color from reference HTML (not used in footer, but kept for consistency)
    const primaryColor = '#2D5A47';
    const currentYear = new Date().getFullYear();
    const rulesUrl = tenantSlug ? `/${tenantSlug}/rules` : footer?.rulesUrl || '#';

    return (
        <footer className="w-full py-12 px-6 border-t border-template4-primary/10 dark:border-gray-800">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="transition-transform hover:scale-105 active:scale-95">
                    <img 
                        src="/spinwheel-logo.svg" 
                        alt="SpinWheel" 
                        className="h-20 w-auto min-w-[150px] object-contain" 
                    />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="flex gap-8 text-[#6B7C75] dark:text-gray-400 text-sm font-medium">
                        {footer?.privacyPolicyUrl && <a href={footer.privacyPolicyUrl} className="hover:text-template4-accent transition-colors">Ethics</a>}
                        {footer?.termsUrl && <a href={footer.termsUrl} className="hover:text-template4-accent transition-colors">Sustainability Report</a>}
                        <a href={rulesUrl} className="hover:text-template4-accent transition-colors">Campaign Terms</a>
                    </div>
                    {(campaign?.supportMobile || campaign?.websiteUrl) && (
                        <div className="flex gap-6 text-sm text-[#6B7C75] dark:text-gray-400">
                            {campaign?.supportMobile && (
                                <a 
                                    href={`https://wa.me/${campaign.supportMobile.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 hover:text-template4-accent transition-colors"
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
                                    className="flex items-center gap-2 hover:text-template4-accent transition-colors"
                                >
                                    <span>🌐</span>
                                    <span>Website</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-sm text-[#6B7C75] dark:text-gray-500">© {currentYear} {PLATFORM_BRAND}. All rights reserved.</p>
            </div>
        </footer>
    );
}
