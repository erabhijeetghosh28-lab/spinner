'use client';

interface FooterData {
    companyName?: string;
    logoUrl?: string;
    privacyPolicyUrl?: string;
    termsUrl?: string;
    rulesUrl?: string;
}

interface MinimalFooterProps {
    footer?: FooterData;
    variant?: 'light' | 'dark' | 'cyan';
}

export default function MinimalFooter({ 
    footer,
    variant = 'light' 
}: MinimalFooterProps) {
    const companyName = footer?.companyName || 'BrandWheel';
    const logoUrl = footer?.logoUrl;
    const privacyUrl = footer?.privacyPolicyUrl || '#';
    const termsUrl = footer?.termsUrl || '#';
    const rulesUrl = footer?.rulesUrl || '#';

    // Theme-specific styles
    const themes = {
        light: {
            bg: 'bg-white',
            borderColor: 'border-gray-200',
            logoColor: 'text-[#181411]',
            accentColor: 'text-[#f48c25]',
            linkColor: 'text-gray-600 hover:text-[#f48c25]',
            copyrightColor: 'text-gray-500'
        },
        dark: {
            bg: 'bg-[#0a0f1d]',
            borderColor: 'border-white/5',
            logoColor: 'text-white',
            accentColor: 'text-[#f48c25]',
            linkColor: 'text-gray-400 hover:text-[#f48c25]',
            copyrightColor: 'text-gray-500'
        },
        cyan: {
            bg: 'bg-[#0a0f1d]',
            borderColor: 'border-white/5',
            logoColor: 'text-white',
            accentColor: 'text-[#00f2ff]',
            linkColor: 'text-gray-400 hover:text-[#00f2ff]',
            copyrightColor: 'text-gray-500'
        }
    };

    const theme = themes[variant];

    return (
        <footer className={`w-full py-12 px-6 border-t ${theme.borderColor} ${theme.bg}`}>
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    {logoUrl ? (
                        <img src={logoUrl} alt={companyName} className="h-8" />
                    ) : (
                        <>
                            {variant === 'cyan' ? (
                                <div className="w-8 h-8 bg-gradient-to-br from-[#00f2ff] to-[#0072ff] rounded-lg flex items-center justify-center text-[#0a0f1d] font-bold">
                                    W
                                </div>
                            ) : (
                                <div className={`w-8 h-8 ${variant === 'light' ? 'bg-[#f48c25]' : 'bg-[#f48c25]'} rounded-lg flex items-center justify-center text-white font-bold`}>
                                    W
                                </div>
                            )}
                            <span className={`font-black text-xl tracking-tight uppercase ${theme.logoColor}`}>
                                {companyName.split(' ')[0]}<span className={theme.accentColor}>{companyName.split(' ')[1] || 'Wheel'}</span>
                            </span>
                        </>
                    )}
                </div>

                {/* Links */}
                <div className="flex gap-8 text-sm font-medium">
                    <a href={privacyUrl} className={`${theme.linkColor} transition-colors`}>
                        Privacy Policy
                    </a>
                    <a href={termsUrl} className={`${theme.linkColor} transition-colors`}>
                        Terms of Service
                    </a>
                    <a href={rulesUrl} className={`${theme.linkColor} transition-colors`}>
                        Rules & Regulations
                    </a>
                </div>

                {/* Copyright */}
                <p className={`text-sm ${theme.copyrightColor}`}>
                    © {new Date().getFullYear()} {companyName}. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
