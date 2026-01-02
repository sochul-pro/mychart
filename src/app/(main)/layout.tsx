import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold">
              MyChart
            </Link>
            <Link href="/watchlist" className="text-sm text-muted-foreground hover:text-foreground">
              관심종목
            </Link>
            <Link href="/screener" className="text-sm text-muted-foreground hover:text-foreground">
              스크리너
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
