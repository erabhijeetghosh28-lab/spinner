'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

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
    { href: '/admin/scanner', label: 'Scanner', icon: '📷' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <Link href="/admin/dashboard" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-2xl font-black">
              W
            </div>
            <div>
              <h1 className="text-2xl font-bold text-amber-500">Campaign Manager</h1>
              <p className="text-slate-400 text-sm">Manage your campaigns</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
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

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              <span className="hidden sm:inline">Logout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex flex-wrap gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
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
      </div>
    </div>
  );
}
