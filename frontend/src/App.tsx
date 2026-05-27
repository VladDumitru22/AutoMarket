import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ListingDetailPage from './pages/ListingDetailPage'
import MyListingsPage from './pages/MyListingsPage'
import CreateListingPage from './pages/CreateListingPage'
import FavoritesPage from './pages/FavoritesPage'
import MessagesPage from './pages/MessagesPage'
import AdminPage from './pages/AdminPage'
import MyOffersPage from './pages/MyOffersPage'
import TermsPage from './pages/TermsPage'

function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <div className="blob-1 absolute -top-52 -left-52 w-[520px] h-[520px] rounded-full bg-orange-400/20 dark:bg-orange-500/25 blur-3xl" />
      <div className="blob-2 absolute -top-24 -right-36 w-[420px] h-[420px] rounded-full bg-rose-400/15 dark:bg-rose-500/22 blur-3xl" />
      <div className="blob-3 absolute bottom-[-80px] left-1/4 w-[380px] h-[380px] rounded-full bg-amber-300/12 dark:bg-amber-600/18 blur-3xl" />
      <div className="blob-4 absolute top-1/3 right-1/3 w-[320px] h-[320px] rounded-full bg-pink-300/10 dark:bg-violet-700/18 blur-3xl" />
    </div>
  )
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
          <GradientBackground />
          <Navbar isDark={isDark} onThemeToggle={() => setIsDark(d => !d)} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
              <Route path="/listings/:id/edit" element={<CreateListingPage />} />
              <Route path="/listings/new" element={<CreateListingPage />} />
              <Route path="/my-listings" element={<MyListingsPage />} />
              <Route path="/my-offers" element={<MyOffersPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:conversationId" element={<MessagesPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200/60 dark:border-white/[0.06] bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm py-5 mt-8">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>© {new Date().getFullYear()} AutoMarket SRL. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  Terms &amp; Conditions
                </Link>
                <a href="mailto:contact@automarket.ro" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
