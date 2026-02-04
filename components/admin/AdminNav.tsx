'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-tenant-id');
    localStorage.removeItem('admin-tenant-data');
    localStorage.removeItem('admin-data');
    router.push('/admin');
  };

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/vouchers', label: 'Vouchers', icon: '🎟️' },
    { href: '/admin/managers', label: 'Managers', icon: '👥' },
    { href: '/admin/scanner', label: 'Scanner', icon: '📷' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <Link href="/admin/dashboard" className="flex items-center space-x-3 sm:space-x-4 hover:opacity-80 transition-opacity z-50 relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-xl sm:text-2xl font-black shrink-0">
              W
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-amber-500 leading-tight">Campaign Manager</h1>
              <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Manage your campaigns</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isActive(link.href)
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-800'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              <span>Logout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden z-50 relative p-2 text-slate-400 hover:text-white"
          >
            {isMenuOpen ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Content */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-40 flex flex-col pt-24 px-6 lg:hidden overflow-y-auto">
            <nav className="flex flex-col space-y-2 mb-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-4 px-4 py-4 rounded-xl font-bold text-lg transition-all ${
                    isActive(link.href)
                      ? 'bg-amber-500 text-slate-900'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto mb-8 border-t border-slate-800 pt-6">
               <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-red-900/20 hover:text-red-500 text-slate-300 font-bold py-4 rounded-xl transition-all"
                >
                  <span>Log Out</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
