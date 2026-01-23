'use client';

import React from 'react';

interface FooterSectionProps {
    footer: any;
    brandColor: string;
}

export default function FooterSection({ footer, brandColor }: FooterSectionProps) {
    const customLinks = footer.customLinks ? (typeof footer.customLinks === 'string' ? JSON.parse(footer.customLinks) : footer.customLinks) : [];

    return (
        <footer className="bg-slate-900 border-t border-slate-800">
            <div className="container mx-auto max-w-7xl px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Column 1: Brand */}
                    <div className="space-y-4">
                        {footer.logoUrl ? (
                            <img src={footer.logoUrl} alt={footer.companyName} className="h-10 mb-4" />
                        ) : (
                            <h3 
                                className="text-2xl font-black"
                                style={{ color: brandColor }}
                            >
                                {footer.companyName}
                            </h3>
                        )}
                        {footer.companyTagline && (
                            <p className="text-slate-400 text-sm">
                                {footer.companyTagline}
                            </p>
                        )}
                        {/* Social Media Icons */}
                        <div className="flex gap-3 pt-4">
                            {footer.facebookUrl && (
                                <a
                                    href={footer.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                                    style={{ color: brandColor }}
                                    title="Facebook"
                                >
                                    <span className="text-xl">📘</span>
                                </a>
                            )}
                            {footer.instagramUrl && (
                                <a
                                    href={footer.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                                    style={{ color: brandColor }}
                                    title="Instagram"
                                >
                                    <span className="text-xl">📷</span>
                                </a>
                            )}
                            {footer.twitterUrl && (
                                <a
                                    href={footer.twitterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                                    style={{ color: brandColor }}
                                    title="Twitter"
                                >
                                    <span className="text-xl">🐦</span>
                                </a>
                            )}
                            {footer.linkedinUrl && (
                                <a
                                    href={footer.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                                    style={{ color: brandColor }}
                                    title="LinkedIn"
                                >
                                    <span className="text-xl">💼</span>
                                </a>
                            )}
                            {footer.youtubeUrl && (
                                <a
                                    href={footer.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                                    style={{ color: brandColor }}
                                    title="YouTube"
                                >
                                    <span className="text-xl">📺</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="font-black text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-slate-400">
                            {customLinks.length > 0 ? (
                                customLinks.map((link: any, index: number) => (
                                    <li key={index}>
                                        <a
                                            href={link.url}
                                            className="hover:text-white transition-colors"
                                            style={{ '--hover-color': brandColor } as React.CSSProperties}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                                    <li><a href="/how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                                    <li><a href="/winners" className="hover:text-white transition-colors">Past Winners</a></li>
                                    <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Column 3: Legal */}
                    <div>
                        <h4 className="font-black text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-slate-400">
                            <li>
                                <a
                                    href={footer.privacyPolicyUrl || '/privacy'}
                                    className="hover:text-white transition-colors"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href={footer.termsUrl || '/terms'}
                                    className="hover:text-white transition-colors"
                                >
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a
                                    href={footer.rulesUrl || '/rules'}
                                    className="hover:text-white transition-colors"
                                >
                                    Contest Rules
                                </a>
                            </li>
                            {footer.disclaimerUrl && (
                                <li>
                                    <a
                                        href={footer.disclaimerUrl}
                                        className="hover:text-white transition-colors"
                                    >
                                        Disclaimer
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Column 4: Contact */}
                    <div>
                        <h4 className="font-black text-white mb-4">Contact Us</h4>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            {footer.supportEmail && (
                                <li className="flex items-start gap-2">
                                    <span>📧</span>
                                    <a
                                        href={`mailto:${footer.supportEmail}`}
                                        className="hover:text-white transition-colors"
                                    >
                                        {footer.supportEmail}
                                    </a>
                                </li>
                            )}
                            {footer.supportPhone && (
                                <li className="flex items-start gap-2">
                                    <span>📱</span>
                                    <a
                                        href={`tel:${footer.supportPhone}`}
                                        className="hover:text-white transition-colors"
                                    >
                                        {footer.supportPhone}
                                    </a>
                                </li>
                            )}
                            {footer.address && (
                                <li className="flex items-start gap-2">
                                    <span>📍</span>
                                    <span>{footer.address}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} {footer.companyName}. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-slate-400">
                        <a href="/sitemap" className="hover:text-white transition-colors">Sitemap</a>
                        <a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a>
                        <a href="/accessibility" className="hover:text-white transition-colors">Accessibility</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
