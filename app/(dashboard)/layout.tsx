import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CollectionSidebar } from '@/components/CollectionSidebar';
import { AddBookmarkForm } from '@/components/AddBookmarkForm';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-600">AI Bookmark Saver</h1>
        </div>

        <div className="p-4">
          <AddBookmarkForm />
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium">
            All Bookmarks
          </Link>
          <Link href="/search" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium">
            Search
          </Link>
        </nav>

        <CollectionSidebar />

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            {session.user.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name ?? 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Sign Out
          </button>
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
