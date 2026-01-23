'use client';

interface FooterProps {
    footer: any;
    campaign?: any;
}

export default function Template4Footer({ footer, campaign }: FooterProps) {
    // Template 4 primary color from reference HTML (not used in footer, but kept for consistency)
    const primaryColor = '#2D5A47';
    const companyName = footer?.companyName || campaign?.name || 'BrandWheel';
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full py-12 px-6 border-t border-template4-primary/10 dark:border-gray-800">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-template4-primary rounded-lg flex items-center justify-center text-white font-bold">NW</div>
                    <span className="font-black text-xl tracking-tight uppercase text-template4-primary dark:text-white">NatureWell</span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="flex gap-8 text-[#6B7C75] dark:text-gray-400 text-sm font-medium">
                        {footer?.privacyPolicyUrl && <a href={footer.privacyPolicyUrl} className="hover:text-template4-accent transition-colors">Ethics</a>}
                        {footer?.termsUrl && <a href={footer.termsUrl} className="hover:text-template4-accent transition-colors">Sustainability Report</a>}
                        {footer?.rulesUrl && <a href={footer.rulesUrl} className="hover:text-template4-accent transition-colors">Campaign Terms</a>}
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
                <p className="text-sm text-[#6B7C75] dark:text-gray-500">© {currentYear} NatureWell Collective. Inspired by Earth.</p>
            </div>
        </footer>
    );
}
