import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  getMyOffers, getReceivedOffers,
  acceptOffer, rejectOffer, counterOffer,
  acceptCounter, rejectCounter,
} from '../api/offers'
import type { Offer } from '../api/offers'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, Tag, CheckCircle, XCircle, User, Inbox } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
    Accepted: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
    Rejected: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
    Countered: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
      {status}
    </span>
  )
}

const cardCls = "bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 p-5"
const inputCls = "bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"

export default function MyOffersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [received, setReceived] = useState<Offer[]>([])
  const [placed, setPlaced] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'received' | 'placed'>('received')
  const [counterInputs, setCounterInputs] = useState<Record<number, string>>({})
  const [showCounter, setShowCounter] = useState<number | null>(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    const [recv, mine] = await Promise.all([
      getReceivedOffers().catch(() => [] as Offer[]),
      getMyOffers().catch(() => [] as Offer[]),
    ])
    setReceived(recv)
    setPlaced(mine.filter(o => o.OfferStatus === 'Pending' || o.OfferStatus === 'Countered'))
    setLoading(false)
  }

  const dateLabel = (d: string) =>
    new Date(d.includes('Z') || d.includes('+') ? d : d + 'Z')
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const pendingCount = received.filter(o => o.OfferStatus === 'Pending').length
  const counterCount = placed.filter(o => o.OfferStatus === 'Countered').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Tag size={18} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Offers</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-white/[0.06] mb-6 w-fit">
        <button
          onClick={() => setTab('received')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'received'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Inbox size={15} />
          Received
          {pendingCount > 0 && (
            <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('placed')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'placed'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Tag size={15} />
          My Offers
          {counterCount > 0 && (
            <span className="bg-sky-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {counterCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-white/60 dark:border-white/10 animate-pulse" />
          ))}
        </div>
      ) : tab === 'received' ? (
        received.length === 0 ? (
          <div className="text-center py-20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/10 shadow-lg">
            <Inbox size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No offers received</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Offers from buyers will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {received.map(o => (
              <div key={o.OfferID} className={cardCls}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <Link to={`/listings/${o.ListingID}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                      {o.listing_title ?? `Listing #${o.ListingID}`}
                    </Link>
                    {o.buyer_name && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{o.buyer_name}</span>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={o.OfferStatus} />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Offer</p>
                    <p className="font-bold text-lg bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                      €{Number(o.OfferedAmount).toLocaleString()}
                    </p>
                  </div>
                  {o.listing_price && (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      Asking: <span className="font-medium text-slate-600 dark:text-slate-300">€{Number(o.listing_price).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {o.OfferStatus === 'Pending' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptOffer(o.OfferID).then(load)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition-colors"
                      >
                        <CheckCircle size={13} /> Accept
                      </button>
                      <button
                        onClick={() => rejectOffer(o.OfferID).then(load)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
                      >
                        <XCircle size={13} /> Decline
                      </button>
                    </div>
                    {showCounter === o.OfferID ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Counter offer (€)"
                          value={counterInputs[o.OfferID] ?? ''}
                          onChange={e => setCounterInputs(p => ({ ...p, [o.OfferID]: e.target.value }))}
                          className={`flex-1 ${inputCls}`}
                        />
                        <button
                          onClick={() => { counterOffer(o.OfferID, Number(counterInputs[o.OfferID])); setShowCounter(null); load() }}
                          className="text-xs bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3 py-1.5 rounded-xl"
                        >
                          Send
                        </button>
                        <button onClick={() => setShowCounter(null)} className="text-xs text-slate-500 px-2">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCounter(o.OfferID)}
                        className="w-full text-xs text-orange-500 dark:text-orange-400 hover:underline text-center py-1"
                      >
                        + Make counter offer
                      </button>
                    )}
                  </div>
                )}

                {o.OfferStatus === 'Countered' && o.CounterAmount && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your counter: <strong className="text-slate-700 dark:text-slate-300">€{Number(o.CounterAmount).toLocaleString()}</strong> — waiting for buyer's response
                  </p>
                )}

                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">{dateLabel(o.OfferDate)}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        placed.length === 0 ? (
          <div className="text-center py-20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/10 shadow-lg">
            <Tag size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No active offers</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Offers you place on listings will appear here</p>
            <Link to="/" className="inline-block mt-4 text-orange-500 dark:text-orange-400 text-sm hover:underline">Browse listings</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {placed.map(o => (
              <div key={o.OfferID} className={cardCls}>
                <div className="flex items-start justify-between gap-4">
                  <Link to={`/listings/${o.ListingID}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                    {o.listing_title ?? `Listing #${o.ListingID}`}
                  </Link>
                  <StatusBadge status={o.OfferStatus} />
                </div>

                {o.listing_price && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Asking: <span className="font-medium text-slate-600 dark:text-slate-300">€{Number(o.listing_price).toLocaleString()}</span>
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your offer</p>
                    <p className="font-bold text-lg bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                      €{Number(o.OfferedAmount).toLocaleString()}
                    </p>
                  </div>

                  {o.OfferStatus === 'Countered' && o.CounterAmount && (
                    <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertCircle size={13} className="text-amber-600 dark:text-amber-400" />
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                          Counter: <strong>€{Number(o.CounterAmount).toLocaleString()}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptCounter(o.OfferID).then(load)}
                          className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button
                          onClick={() => rejectCounter(o.OfferID).then(load)}
                          className="flex items-center gap-1 text-xs border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
                        >
                          <XCircle size={12} /> Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {o.OfferStatus === 'Pending' && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">Waiting for seller's response…</p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{dateLabel(o.OfferDate)}</p>
                  <Link to={`/listings/${o.ListingID}`} className="text-xs text-orange-500 dark:text-orange-400 hover:underline">
                    View listing →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
