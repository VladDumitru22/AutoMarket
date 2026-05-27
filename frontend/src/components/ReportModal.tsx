import { useState } from 'react'
import { X, Flag, CheckCircle2 } from 'lucide-react'
import api from '../api/client'

const REASONS = [
  'Fraudulent / fake listing',
  'Misleading price',
  'Incorrect technical information',
  'Photos do not match the vehicle',
  'Vehicle already sold',
  'Other',
]

interface Props {
  listingId: number
  onClose: () => void
}

export default function ReportModal({ listingId, onClose }: Props) {
  const [selected, setSelected] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const reason = selected === 'Other' ? details || 'Other' : `${selected}${details ? ': ' + details : ''}`
      await api.post('/reports', { listing_id: listingId, reason })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5 font-semibold text-slate-900 dark:text-slate-100">
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Flag size={14} className="text-red-500" />
            </div>
            Report listing
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Report submitted</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Our team will review the listing shortly.</p>
            <button
              onClick={onClose}
              className="mt-5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-6 py-2 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Select a reason for reporting:</p>
            <div className="space-y-1.5">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all duration-150 ${
                    selected === r
                      ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300'
                      : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">
                {selected === 'Other' ? 'Describe the issue *' : 'Additional details (optional)'}
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Add more details…"
                className="w-full bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={submit}
                disabled={!selected || loading || (selected === 'Other' && !details)}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-red-500/20 disabled:opacity-40 transition-all"
              >
                {loading ? 'Sending…' : 'Submit report'}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
