'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/watchlist', label: '관심종목' },
  { href: '/screener', label: '스크리너' },
];

interface HeaderProps {
  userEmail?: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MobileNav userEmail={userEmail} />
          <Link href="/dashboard" className="text-lg font-bold">
            MyChart
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm transition-colors',
                    isActive
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/settings"
            className={cn(
              'text-sm transition-colors',
              pathname === '/settings'
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            설정
          </Link>
          {userEmail && (
            <span className="text-sm text-muted-foreground">{userEmail}</span>
          )}
        </div>
      </div>
    </header>
  );
}
