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
    Pending: 'bg-amber-100 text-amber-700',
    Accepted: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Countered: 'bg-sky-100 text-sky-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

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

  const handleAccept = async (offerId: number) => {
    await acceptOffer(offerId)
    load()
  }

  const handleReject = async (offerId: number) => {
    await rejectOffer(offerId)
    load()
  }

  const handleCounter = async (offerId: number) => {
    const amount = Number(counterInputs[offerId])
    if (!amount || amount <= 0) return
    await counterOffer(offerId, amount)
    setShowCounter(null)
    load()
  }

  const handleAcceptCounter = async (offerId: number) => {
    await acceptCounter(offerId)
    load()
  }

  const handleRejectCounter = async (offerId: number) => {
    await rejectCounter(offerId)
    load()
  }

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Tag size={22} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">Offers</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('received')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'received'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Inbox size={16} />
          Received
          {received.filter(o => o.OfferStatus === 'Pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
              {received.filter(o => o.OfferStatus === 'Pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('placed')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'placed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag size={16} />
          My Offers
          {placed.filter(o => o.OfferStatus === 'Countered').length > 0 && (
            <span className="bg-sky-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
              {placed.filter(o => o.OfferStatus === 'Countered').length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading…</div>
      ) : tab === 'received' ? (
        /* ── RECEIVED OFFERS ── */
        received.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Inbox size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">No offers received</p>
            <p className="text-sm text-slate-400 mt-1">Offers from buyers will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {received.map(o => (
              <div key={o.OfferID} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <Link
                      to={`/listings/${o.ListingID}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {o.listing_title ?? `Listing #${o.ListingID}`}
                    </Link>
                    {o.buyer_name && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">{o.buyer_name}</span>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={o.OfferStatus} />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Offer</p>
                    <p className="font-bold text-blue-600 text-lg">€{Number(o.OfferedAmount).toLocaleString()}</p>
                  </div>
                  {o.listing_price && (
                    <div className="text-xs text-slate-400">
                      Asking: <span className="font-medium text-slate-600">€{Number(o.listing_price).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {o.OfferStatus === 'Pending' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(o.OfferID)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle size={13} /> Accept
                      </button>
                      <button
                        onClick={() => handleReject(o.OfferID)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50"
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
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                        />
                        <button
                          onClick={() => handleCounter(o.OfferID)}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                        >
                          Send
                        </button>
                        <button onClick={() => setShowCounter(null)} className="text-xs text-slate-500 px-2">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCounter(o.OfferID)}
                        className="w-full text-xs text-blue-600 hover:underline text-center py-1"
                      >
                        + Make counter offer
                      </button>
                    )}
                  </div>
                )}

                {o.OfferStatus === 'Countered' && o.CounterAmount && (
                  <p className="text-xs text-slate-500">
                    Your counter: <strong>€{Number(o.CounterAmount).toLocaleString()}</strong> — waiting for buyer's response
                  </p>
                )}

                <p className="text-xs text-slate-400 mt-3">{dateLabel(o.OfferDate)}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── MY PLACED OFFERS ── */
        placed.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Tag size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">No active offers</p>
            <p className="text-sm text-slate-400 mt-1">Offers you place on listings will appear here</p>
            <Link to="/" className="inline-block mt-4 text-blue-600 text-sm hover:underline">Browse listings</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {placed.map(o => (
              <div key={o.OfferID} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    to={`/listings/${o.ListingID}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {o.listing_title ?? `Listing #${o.ListingID}`}
                  </Link>
                  <StatusBadge status={o.OfferStatus} />
                </div>

                {o.listing_price && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Asking price: <span className="font-medium text-slate-600">€{Number(o.listing_price).toLocaleString()}</span>
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Your offer</p>
                    <p className="font-bold text-blue-600 text-lg">€{Number(o.OfferedAmount).toLocaleString()}</p>
                  </div>

                  {o.OfferStatus === 'Countered' && o.CounterAmount && (
                    <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertCircle size={14} className="text-amber-600" />
                        <p className="text-xs font-medium text-amber-800">
                          Counter offer: <strong>€{Number(o.CounterAmount).toLocaleString()}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptCounter(o.OfferID)}
                          className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                        >
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button
                          onClick={() => handleRejectCounter(o.OfferID)}
                          className="flex items-center gap-1 text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                          <XCircle size={12} /> Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {o.OfferStatus === 'Pending' && (
                    <p className="text-xs text-slate-400 italic">Waiting for seller's response…</p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400">{dateLabel(o.OfferDate)}</p>
                  <Link to={`/listings/${o.ListingID}`} className="text-xs text-blue-600 hover:underline">
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
