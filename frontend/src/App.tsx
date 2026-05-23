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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
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
          <footer className="border-t border-slate-200 bg-white py-4 mt-8">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-slate-400">
              <span>© {new Date().getFullYear()} AutoMarket SRL. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms &amp; Conditions</Link>
                <a href="mailto:contact@automarket.ro" className="hover:text-slate-600 transition-colors">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
