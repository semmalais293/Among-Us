import './globals.css'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import NavbarClient from '@/components/NavbarClient'

export const metadata: Metadata = {
  title: 'Dogfood Hackathon Platform',
  description: 'Self-hostable, offline-first hackathon submission and judging platform',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 flex flex-col min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  D
                </div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Dogfood<span className="text-indigo-400">Portal</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link
                  href="/gallery"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Gallery
                </Link>
                {user && (
                  <>
                    <Link
                      href="/participant"
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      My Team & Submissions
                    </Link>
                    {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                      <Link
                        href="/organizer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        Organizer Dashboard
                      </Link>
                    )}
                    {(user.role === 'JUDGE' || user.role === 'ADMIN') && (
                      <Link
                        href="/judge"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Judging
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </div>

            <NavbarClient user={user} />
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="border-t border-slate-800/60 bg-[#070a12] py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p>Dogfood Hackathon Platform • 100% Offline & Self-Hostable • Built for Among-Us</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
