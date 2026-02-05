'use client';

interface FooterProps {
    footer: any;
    campaign?: any;
    tenantSlug?: string;
}

export default function Template2Footer({ footer, campaign, tenantSlug }: FooterProps) {
    // Template 2 primary color from reference HTML (not used in footer, but kept for consistency)
    const primaryColor = '#00f2ff';
    const companyName = footer?.companyName || campaign?.name || 'BrandWheel';
    const currentYear = new Date().getFullYear();

    const rulesUrl = tenantSlug ? `/${tenantSlug}/rules` : footer?.rulesUrl;

    return (
        <footer className="w-full py-12 px-6 border-t border-white/5 bg-template2-navy-dark">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-template2-primary to-template2-accent rounded-lg flex items-center justify-center text-template2-navy-dark font-bold">W</div>
                    <span className="font-black text-xl tracking-tight uppercase text-white">Brand<span className="text-template2-primary">Wheel</span></span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="flex gap-8 text-gray-400 text-sm font-medium">
                        {footer?.privacyPolicyUrl && <a href={footer.privacyPolicyUrl} className="hover:text-template2-primary transition-colors">Privacy Policy</a>}
                        {footer?.termsUrl && <a href={footer.termsUrl} className="hover:text-template2-primary transition-colors">Terms of Service</a>}
                        {footer?.rulesUrl && <a href={footer.rulesUrl} className="hover:text-template2-primary transition-colors">Rules & Regulations</a>}
                    </div>
                    {(campaign?.supportMobile || campaign?.websiteUrl) && (
                        <div className="flex gap-6 text-sm text-gray-400">
                            {campaign?.supportMobile && (
                                <a 
                                    href={`https://wa.me/${campaign.supportMobile.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 hover:text-template2-primary transition-colors"
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
                                    className="flex items-center gap-2 hover:text-template2-primary transition-colors"
                                >
                                    <span>🌐</span>
                                    <span>Website</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-500">© {currentYear} BrandWheel Inc. Powered by Electric Innovation.</p>
            </div>
        </footer>
    );
}
