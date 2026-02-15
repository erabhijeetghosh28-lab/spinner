'use client';

import Link from 'next/link';

interface FooterProps {
    scrollToSection: (id: string) => void;
}

export function Footer({ scrollToSection }: FooterProps) {
    return (
        <footer className="bg-slate-900 text-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 pb-16 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                                <img 
                                    src="/spinwheel-logo.svg" 
                                    alt="SpinWheel Logo" 
                                    className="h-20 w-auto min-w-[150px] object-contain" 
                                />
                            </Link>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            The ultimate customer engagement and lead generation platform for digital marketing and secure brand verification.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-lg mb-6">Product</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-500 transition-colors duration-200">Features</button></li>
                            <li><button onClick={() => {}} className="hover:text-cyan-500 transition-colors duration-200">Integrations</button></li>
                            <li><button onClick={() => scrollToSection('pricing')} className="hover:text-cyan-500 transition-colors duration-200">Pricing</button></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-lg mb-6">Support</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><button onClick={() => {}} className="hover:text-cyan-500 transition-colors duration-200">About Us</button></li>
                            <li><button onClick={() => scrollToSection('contact')} className="hover:text-cyan-500 transition-colors duration-200 text-left">Contact Us</button></li>
                            <li><Link href="/admin" className="hover:text-cyan-500 transition-colors duration-200">Admin Login</Link></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-lg mb-6">Ready to scale?</h4>
                        <Link href="/admin/signup" className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl text-center transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95">
                            Start Free Trial
                        </Link>
                        <p className="mt-4 text-xs text-gray-500 text-center">No credit card required</p>
                    </div>
                </div>
                
                <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} The Lead Spin Team. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
