import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import api from '../api/client'

const REASONS = [
  'Anunț fals / fraudulos',
  'Preț înșelător',
  'Informații tehnice incorecte',
  'Imagini care nu corespund realității',
  'Vehicul deja vândut',
  'Altul',
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
      const reason = selected === 'Altul' ? details || 'Altul' : `${selected}${details ? ': ' + details : ''}`
      await api.post('/reports', { listing_id: listingId, reason })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Flag size={18} className="text-red-500" />
            Raportează anunțul
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="text-green-500 text-4xl mb-3">✓</div>
            <p className="font-medium text-slate-900">Raport trimis</p>
            <p className="text-sm text-slate-500 mt-1">Echipa noastră va analiza anunțul în curând.</p>
            <button onClick={onClose} className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-lg text-sm">
              Închide
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-600">Selectează motivul raportării:</p>
            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    selected === r
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                {selected === 'Altul' ? 'Descrie problema *' : 'Detalii suplimentare (opțional)'}
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Adaugă mai multe detalii..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={submit}
                disabled={!selected || loading || (selected === 'Altul' && !details)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40"
              >
                {loading ? 'Se trimite...' : 'Trimite raport'}
              </button>
              <button onClick={onClose} className="px-5 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Anulează
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
