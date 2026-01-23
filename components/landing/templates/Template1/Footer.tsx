'use client';

interface FooterProps {
    footer: any;
    campaign?: any;
}

export default function Template1Footer({ footer, campaign }: FooterProps) {
    // Template 1 primary color from reference HTML
    const primaryColor = '#f48c25';
    const companyName = footer?.companyName || campaign?.name || 'BrandWheel';
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full py-12 px-6 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    {footer?.logoUrl ? (
                        <img src={footer.logoUrl} alt={companyName} className="w-8 h-8 rounded-lg" />
                    ) : (
                        <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {companyName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="font-black text-xl tracking-tight uppercase">{companyName}</span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="flex gap-8 text-[#8a7560] dark:text-gray-400 text-sm font-medium">
                        {footer?.privacyPolicyUrl && (
                            <a 
                                href={footer.privacyPolicyUrl} 
                                className="hover:text-primary transition-colors"
                                style={{ color: primaryColor }}
                            >
                                Privacy Policy
                            </a>
                        )}
                        {footer?.termsUrl && (
                            <a 
                                href={footer.termsUrl} 
                                className="hover:text-primary transition-colors"
                                style={{ color: primaryColor }}
                            >
                                Terms of Service
                            </a>
                        )}
                        {footer?.rulesUrl && (
                            <a 
                                href={footer.rulesUrl} 
                                className="hover:text-primary transition-colors"
                                style={{ color: primaryColor }}
                            >
                                Rules & Regulations
                            </a>
                        )}
                    </div>
                    {(campaign?.supportMobile || campaign?.websiteUrl) && (
                        <div className="flex gap-6 text-sm">
                            {campaign?.supportMobile && (
                                <a 
                                    href={`https://wa.me/${campaign.supportMobile.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-[#8a7560] dark:text-gray-400 transition-colors"
                                    style={{ color: '#8a7560' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#8a7560'}
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
                                    className="flex items-center gap-2 text-[#8a7560] dark:text-gray-400 transition-colors"
                                    style={{ color: '#8a7560' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#8a7560'}
                                >
                                    <span>🌐</span>
                                    <span>Website</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-sm text-[#8a7560] dark:text-gray-500">© {currentYear} {companyName} Inc. All rights reserved.</p>
            </div>
        </footer>
    );
}
