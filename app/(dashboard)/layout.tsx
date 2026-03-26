import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CollectionSidebar } from '@/components/CollectionSidebar';
import { AddBookmarkForm } from '@/components/AddBookmarkForm';
import { SignOutButton } from '@/components/SignOutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <h1 className="text-lg font-bold text-sidebar-foreground">AI Bookmark Saver</h1>
          <ThemeToggle />
        </div>

        <div className="p-4">
          <AddBookmarkForm />
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
          >
            All Bookmarks
          </Link>
          <Link
            href="/search"
            className="block px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
          >
            Search
          </Link>
        </nav>

        <CollectionSidebar />

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback>{session.user.name?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {session.user.name ?? 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
