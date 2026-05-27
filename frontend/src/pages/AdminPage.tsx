import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Flag, Users, Car, CheckCircle, XCircle, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react'

interface Report {
  ReportID: number
  ListingID: number | null
  MessageID: number | null
  ReporterID: number
  Reason: string
  ReportStatus: string
  CreatedAt: string
  reporter_name: string | null
  listing_title: string | null
  listing_image: string | null
}

interface Stats {
  pending_reports: number
  total_users: number
  active_listings: number
}

function timeAgo(dateStr: string): string {
  const utc = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const diff = Date.now() - new Date(utc).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function ReasonBadge({ reason }: { reason: string }) {
  const colors: Record<string, string> = {
    'Fraudulent / fake listing': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
    'Misleading price': 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
    'Incorrect technical information': 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    'Photos do not match the vehicle': 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    'Vehicle already sold': 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  }
  const matchedKey = Object.keys(colors).find(k => reason.startsWith(k))
  const cls = matchedKey ? colors[matchedKey] : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>
      {reason}
    </span>
  )
}

const statCard = (icon: React.ReactNode, value: number | string | undefined, label: string, iconBg: string) => (
  <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-black/5 dark:shadow-black/20">
    <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value ?? '—'}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  </div>
)

export default function AdminPage() {
  const { user, isAdmin, token } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [resolving, setResolving] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingRemove, setPendingRemove] = useState<{ reportId: number; title: string | null } | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([
        api.get<Report[]>('/admin/reports'),
        api.get<Stats>('/admin/stats'),
      ])
      setReports(r.data)
      setStats(s.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!isAdmin) { navigate('/'); return }
    loadData()

    if (!token) return
    let isUnmounted = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (isUnmounted) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications?token=${token}`)
      ws.onmessage = () => loadData()
      ws.onclose = () => { if (!isUnmounted) reconnectTimer = setTimeout(connect, 3000) }
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
  }, [user, isAdmin, token, loadData])

  const resolve = async (id: number, action: string) => {
    setResolving(id)
    try {
      await api.post(`/admin/reports/${id}/resolve`, null, { params: { action } })
      setReports(prev => prev.filter(r => r.ReportID !== id))
      setStats(prev => prev ? { ...prev, pending_reports: Math.max(0, prev.pending_reports - 1) } : prev)
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Panel</h1>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all backdrop-blur-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCard(<Flag size={20} className="text-red-500" />, stats?.pending_reports, 'Pending Reports', 'bg-red-50 dark:bg-red-500/15')}
        {statCard(<Users size={20} className="text-blue-500" />, stats?.total_users, 'Registered Users', 'bg-blue-50 dark:bg-blue-500/15')}
        {statCard(<Car size={20} className="text-green-500" />, stats?.active_listings, 'Active Listings', 'bg-green-50 dark:bg-green-500/15')}
      </div>

      {/* Reports */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/25 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Pending Reports
            {reports.length > 0 && (
              <span className="ml-2 text-xs bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                {reports.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle size={36} className="text-green-400 mx-auto mb-2" />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">No pending reports</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Everything looks good!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
            {reports.map(r => (
              <div key={r.ReportID} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                  {r.listing_image ? (
                    <img src={r.listing_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car size={20} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {r.listing_title ?? (r.ListingID ? `Listing #${r.ListingID}` : `Message #${r.MessageID}`)}
                    </span>
                    {r.ListingID && (
                      <Link to={`/listings/${r.ListingID}`} className="text-orange-500 hover:text-orange-600 flex-shrink-0" target="_blank">
                        <ExternalLink size={13} />
                      </Link>
                    )}
                  </div>
                  <div className="mt-1.5">
                    <ReasonBadge reason={r.Reason} />
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    Reported by{' '}
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {r.reporter_name ?? `User #${r.ReporterID}`}
                    </span>
                    {' · '}{timeAgo(r.CreatedAt)}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {r.ListingID && (
                    <button
                      onClick={() => setPendingRemove({ reportId: r.ReportID, title: r.listing_title })}
                      disabled={resolving === r.ReportID}
                      className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-1.5 rounded-xl disabled:opacity-50 transition-all shadow-sm"
                    >
                      <XCircle size={13} /> Remove
                    </button>
                  )}
                  <button
                    onClick={() => resolve(r.ReportID, 'dismiss')}
                    disabled={resolving === r.ReportID}
                    className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle size={13} /> Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Remove listing?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will permanently remove{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {pendingRemove.title ?? 'this listing'}
              </span>
              {' '}and resolve the report. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { resolve(pendingRemove.reportId, 'remove'); setPendingRemove(null) }}
                disabled={resolving !== null}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
              >
                Yes, remove it
              </button>
              <button
                onClick={() => setPendingRemove(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
