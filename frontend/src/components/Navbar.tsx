import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Car, Heart, MessageSquare, LogOut, User, Shield, Tag, Moon, Sun } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { getNotificationCount } from '../api/notifications'
import type { NotificationCount } from '../api/notifications'

interface NavbarProps {
  isDark: boolean
  onThemeToggle: () => void
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function Navbar({ isDark, onThemeToggle }: NavbarProps) {
  const { user, logout, isAdmin, token } = useAuth()
  const navigate = useNavigate()
  const [notif, setNotif] = useState<NotificationCount | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!user || !token) { setNotif(null); return }

    let isUnmounted = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const fetchCount = () =>
      getNotificationCount().then(setNotif).catch(() => {})

    const connect = () => {
      if (isUnmounted) return
      fetchCount()

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications?token=${token}`)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'notification_update') {
            setTimeout(fetchCount, 150)
          }
        } catch { /* ignore */ }
      }

      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => ws.close()
      wsRef.current = ws
    }

    connect()

    return () => {
      isUnmounted = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [user, token])

  return (
    <nav className="bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.08] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Car size={16} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            AutoMarket
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium transition-colors">
            Listings
          </Link>

          {user ? (
            <>
              {!isAdmin && (
                <>
                  <Link to="/favorites" className="relative text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" title="Favorites">
                    <Heart size={20} />
                  </Link>

                  <Link to="/messages" className="relative text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors" title="Messages">
                    <MessageSquare size={20} />
                    <Badge count={notif?.unread_messages ?? 0} />
                  </Link>

                  <Link to="/my-offers" className="relative text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors" title="My Offers">
                    <Tag size={20} />
                    <Badge count={(notif?.pending_offers ?? 0) + (notif?.counter_offers ?? 0)} />
                  </Link>

                  <Link to="/my-listings" className="text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors" title="My Listings">
                    <User size={20} />
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors" title="Admin Panel">
                  <span className="relative">
                    <Shield size={18} />
                    <Badge count={notif?.pending_reports ?? 0} />
                  </span>
                  Reports
                </Link>
              )}

              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Log out"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-orange-500/25 font-medium transition-all duration-200"
              >
                Register
              </Link>
            </>
          )}

          <button
            onClick={onThemeToggle}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
