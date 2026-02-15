'use client';

import Link from 'next/link';

interface HeaderProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    scrollToSection: (id: string) => void;
}

export function Header({ mobileMenuOpen, setMobileMenuOpen, scrollToSection }: HeaderProps) {
    return (
        <header className="w-full border-b border-gray-100 bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 group cursor-pointer">
                    <img 
                        src="/spinwheel-logo.svg" 
                        alt="SpinWheel Logo" 
                        className="h-24 w-auto min-w-[180px] object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                </Link>
                
                <div className="flex items-center gap-8">
                    <nav className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('features')} className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200 relative group">
                            Features
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-200 group-hover:w-full"></span>
                        </button>
                        <button onClick={() => scrollToSection('how-it-works')} className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200 relative group">
                            How it Works
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-200 group-hover:w-full"></span>
                        </button>
                        <button onClick={() => scrollToSection('pricing')} className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200 relative group">
                            Pricing
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-200 group-hover:w-full"></span>
                        </button>
                        <button onClick={() => scrollToSection('contact')} className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200 relative group">
                            Contact Us
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-200 group-hover:w-full"></span>
                        </button>
                    </nav>
                    
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/admin" className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200">
                            Login
                        </Link>
                        <Link href="/admin/signup" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/40 active:scale-95">
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="md:hidden p-2 text-slate-600 hover:text-cyan-500 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 py-6 px-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <nav className="flex flex-col gap-4">
                        <button 
                            onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} 
                            className="text-left py-2 text-lg font-semibold text-slate-600 hover:text-cyan-500"
                        >
                            Features
                        </button>
                        <button 
                            onClick={() => { scrollToSection('how-it-works'); setMobileMenuOpen(false); }} 
                            className="text-left py-2 text-lg font-semibold text-slate-600 hover:text-cyan-500"
                        >
                            How it Works
                        </button>
                        <button 
                            onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }} 
                            className="text-left py-2 text-lg font-semibold text-slate-600 hover:text-cyan-500"
                        >
                            Pricing
                        </button>
                        <button 
                            onClick={() => { scrollToSection('contact'); setMobileMenuOpen(false); }} 
                            className="text-left py-2 text-lg font-semibold text-slate-600 hover:text-cyan-500"
                        >
                            Contact Us
                        </button>
                    </nav>
                    <div className="pt-4 flex flex-col gap-3">
                        <Link 
                            href="/admin" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-3 text-center text-lg font-semibold text-slate-600 bg-gray-50 rounded-xl"
                        >
                            Login
                        </Link>
                        <Link 
                            href="/admin/signup" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-3 text-center text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
