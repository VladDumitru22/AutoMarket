import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Car, Heart, MessageSquare, LogOut, User, Shield } from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Car size={24} />
          AutoMarket
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
            Browse
          </Link>

          {user ? (
            <>
              <Link to="/favorites" className="text-slate-600 hover:text-slate-900">
                <Heart size={20} />
              </Link>
              <Link to="/messages" className="text-slate-600 hover:text-slate-900">
                <MessageSquare size={20} />
              </Link>
              <Link to="/my-listings" className="text-slate-600 hover:text-slate-900">
                <User size={20} />
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-slate-600 hover:text-slate-900">
                  <Shield size={20} />
                </Link>
              )}
              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
