'use client';

import Link from 'next/link';

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
    // Always show platform brand in footer
    const companyName = 'SpinWheel';
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
                {/* Logo Section */}
                <div className="flex flex-col items-center md:items-start gap-6">
                    {/* Official SpinWheel Branding */}
                    <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
                        <img 
                            src="/spinwheel-logo.svg" 
                            alt="SpinWheel" 
                            className="h-20 w-auto min-w-[150px] object-contain" 
                        />
                    </Link>

                    {/* Optional Tenant Branding (if they want to show their logo) */}
                    {logoUrl && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Partnered with</span>
                            <img src={logoUrl} alt={footer?.companyName || 'Brand'} className="h-6" />
                        </div>
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
