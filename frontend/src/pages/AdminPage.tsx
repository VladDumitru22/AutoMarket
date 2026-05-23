import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Report {
  ReportID: number
  ListingID: number | null
  MessageID: number | null
  ReporterID: number
  Reason: string
  ReportStatus: string
  CreatedAt: string
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!isAdmin) { navigate('/'); return }
    api.get<Report[]>('/admin/reports').then(r => setReports(r.data))
  }, [user, isAdmin])

  const resolve = async (id: number, action: string) => {
    await api.post(`/admin/reports/${id}/resolve`, null, { params: { action } })
    setReports(prev => prev.filter(r => r.ReportID !== id))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Panel</h1>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Pending Reports ({reports.length})</h2>
        </div>

        {reports.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">No pending reports</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map(r => (
              <div key={r.ReportID} className="p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {r.ListingID ? `Listing #${r.ListingID}` : `Message #${r.MessageID}`}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">{r.Reason}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(r.CreatedAt).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {r.ListingID && (
                    <button
                      onClick={() => resolve(r.ReportID, 'remove')}
                      className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
                    >
                      Remove listing
                    </button>
                  )}
                  <button
                    onClick={() => resolve(r.ReportID, 'dismiss')}
                    className="text-xs border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
