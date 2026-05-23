import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Car, Heart, MessageSquare, LogOut, User, Shield, Tag } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
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
      fetchCount()  // always fetch immediately on (re)connect

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications?token=${token}`)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'notification_update') {
            // Small delay lets markRead (from MessagesPage) complete before we fetch
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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Car size={24} />
          AutoMarket
        </Link>

        <div className="flex items-center gap-5">
          <Link to="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
            Listings
          </Link>

          {user ? (
            <>
              {!isAdmin && (
                <>
                  <Link to="/favorites" className="relative text-slate-600 hover:text-slate-900" title="Favorites">
                    <Heart size={20} />
                  </Link>

                  <Link to="/messages" className="relative text-slate-600 hover:text-slate-900" title="Messages">
                    <MessageSquare size={20} />
                    <Badge count={notif?.unread_messages ?? 0} />
                  </Link>

                  <Link to="/my-offers" className="relative text-slate-600 hover:text-slate-900" title="My Offers">
                    <Tag size={20} />
                    <Badge count={(notif?.pending_offers ?? 0) + (notif?.counter_offers ?? 0)} />
                  </Link>

                  <Link to="/my-listings" className="text-slate-600 hover:text-slate-900" title="My Listings">
                    <User size={20} />
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium" title="Admin Panel">
                  <span className="relative">
                    <Shield size={18} />
                    <Badge count={notif?.pending_reports ?? 0} />
                  </span>
                  Reports
                </Link>
              )}

              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-slate-400 hover:text-slate-600"
                title="Log out"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                Sign in
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
