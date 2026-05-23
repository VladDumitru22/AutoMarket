import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Car, Heart, MessageSquare, LogOut, User, Shield, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getNotificationCount } from '../api/notifications'
import type { NotificationCount } from '../api/notifications'

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [notif, setNotif] = useState<NotificationCount | null>(null)

  useEffect(() => {
    if (!user) { setNotif(null); return }
    const fetch = () => getNotificationCount().then(setNotif).catch(() => {})
    fetch()
    const interval = setInterval(fetch, 30_000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Car size={24} />
          AutoMarket
        </Link>

        <div className="flex items-center gap-5">
          <Link to="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
            Anunțuri
          </Link>

          {user ? (
            <>
              <Link to="/favorites" className="relative text-slate-600 hover:text-slate-900" title="Favorite">
                <Heart size={20} />
              </Link>

              <Link to="/messages" className="relative text-slate-600 hover:text-slate-900" title="Mesaje">
                <MessageSquare size={20} />
                <Badge count={notif?.unread_messages ?? 0} />
              </Link>

              <Link to="/my-listings" className="relative text-slate-600 hover:text-slate-900" title="Ofertele mele">
                <Tag size={20} />
                <Badge count={(notif?.pending_offers ?? 0) + (notif?.counter_offers ?? 0)} />
              </Link>

              <Link to="/my-listings" className="text-slate-600 hover:text-slate-900" title="Contul meu">
                <User size={20} />
              </Link>

              {isAdmin && (
                <Link to="/admin" className="text-slate-600 hover:text-slate-900" title="Admin">
                  <Shield size={20} />
                </Link>
              )}

              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-slate-400 hover:text-slate-600"
                title="Deconectare"
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
                Înregistrare
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
