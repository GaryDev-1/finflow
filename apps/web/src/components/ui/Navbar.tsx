'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, clearAuth, type StoredUser } from '@/lib/auth';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Loans', href: '/loans' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  function handleLogout() {
    clearAuth();
    setUser(null);
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="border-b border-white/10 bg-[oklch(0.15_0.01_250)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-[oklch(0.6_0.2_250)]">FinFlow</span>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'text-[oklch(0.6_0.2_250)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="w-px h-4 bg-white/10" />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/50">
                <span className="text-white/80 font-medium">{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[oklch(0.6_0.2_250)] hover:text-[oklch(0.65_0.2_250)] transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
