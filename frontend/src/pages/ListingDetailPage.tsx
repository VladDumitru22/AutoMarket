import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing, markSold, deleteListing } from '../api/listings'
import type { Listing } from '../api/listings'
import {
  placeOffer, getListingOffers, acceptOffer, rejectOffer,
  counterOffer, acceptCounter, rejectCounter, getMyOffers,
} from '../api/offers'
import type { Offer } from '../api/offers'
import { startConversation } from '../api/conversations'
import { addFavorite, removeFavorite } from '../api/favorites'
import { useAuth } from '../context/AuthContext'
import {
  Heart, MessageSquare, Gauge, Calendar, Zap, Trash2, CheckCircle,
  ChevronRight, AlertCircle, Flag,
} from 'lucide-react'
import ReportModal from '../components/ReportModal'

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

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState<Listing | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [myOffer, setMyOffer] = useState<Offer | null>(null)
  const [offerAmount, setOfferAmount] = useState('')
  const [counterInput, setCounterInput] = useState<{ [id: number]: string }>({})
  const [showCounterInput, setShowCounterInput] = useState<number | null>(null)
  const [fav, setFav] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [soldPrice, setSoldPrice] = useState('')
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [offerError, setOfferError] = useState('')
  const [offerLoading, setOfferLoading] = useState(false)

  const isSeller = user && listing && user.UserID === listing.SellerID
  const isActive = listing?.StatusID === 1

  useEffect(() => {
    if (!id) return
    getListing(Number(id)).then(setListing)
  }, [id])

  useEffect(() => {
    if (!listing) return
    if (isSeller) {
      getListingOffers(listing.ListingID).then(setOffers).catch(() => {})
    } else if (user) {
      getMyOffers()
        .then(all => {
          const mine = all.find(o => o.ListingID === listing.ListingID)
          setMyOffer(mine ?? null)
        })
        .catch(() => {})
    }
  }, [listing, user])

  if (!listing) return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center text-slate-500">
      <div className="animate-pulse space-y-4">
        <div className="h-80 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )

  const handleOffer = async () => {
    if (!user) { navigate('/login'); return }
    if (!offerAmount || Number(offerAmount) <= 0) {
      setOfferError('Please enter a valid amount')
      return
    }
    setOfferError('')
    setOfferLoading(true)
    try {
      const o = await placeOffer(listing.ListingID, Number(offerAmount))
      setMyOffer(o)
      setOfferAmount('')
    } catch (err: any) {
      setOfferError(err?.response?.data?.detail ?? 'Error submitting offer')
    } finally {
      setOfferLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return }
    const conv = await startConversation(listing.ListingID)
    navigate(`/messages/${conv.ConversationID}`)
  }

  const handleMarkSold = async () => {
    await markSold(listing.ListingID, soldPrice ? Number(soldPrice) : undefined)
    setShowSoldModal(false)
    getListing(listing.ListingID).then(setListing)
  }

  const handleDelete = async () => {
    await deleteListing(listing.ListingID)
    setShowDeleteConfirm(false)
    navigate(isAdmin ? '/admin' : '/my-listings')
  }

  const toggleFav = async () => {
    if (!user) { navigate('/login'); return }
    if (fav) { await removeFavorite(listing.ListingID); setFav(false) }
    else { await addFavorite(listing.ListingID); setFav(true) }
  }

  const refreshOffers = () => getListingOffers(listing.ListingID).then(setOffers)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div>
            <div className="bg-slate-100 rounded-xl overflow-hidden h-80 mb-3">
              {listing.images[activeImage] ? (
                <img src={listing.images[activeImage].ImageURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No image</div>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.images.map((img, i) => (
                  <button
                    key={img.ImageID}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img.ImageURL} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {listing.model?.brand?.Name} {listing.model?.Name} {listing.ManufacturingYear}
                </h1>
                {!isActive && (
                  <span className="inline-block mt-1 bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">Sold</span>
                )}
              </div>
              <div className="text-2xl font-bold text-blue-600 whitespace-nowrap">
                €{Number(listing.Price).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                <Gauge size={15} />{listing.Mileage.toLocaleString()} km
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                <Calendar size={15} />{listing.ManufacturingYear}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                <Zap size={15} />{listing.HorsePower} HP
              </span>
            </div>

            {listing.Description && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{listing.Description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          {/* Buyer actions */}
          {!isSeller && !isAdmin && user && isActive && (
            <>
              {/* Offer section */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                {myOffer ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">Your offer</h3>
                      <StatusBadge status={myOffer.OfferStatus} />
                    </div>
                    <div className="text-xl font-bold text-blue-600 mb-2">
                      €{Number(myOffer.OfferedAmount).toLocaleString()}
                    </div>

                    {myOffer.OfferStatus === 'Countered' && myOffer.CounterAmount && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">
                              Seller counter-offered: <strong>€{Number(myOffer.CounterAmount).toLocaleString()}</strong>
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => acceptCounter(myOffer.OfferID).then(o => setMyOffer(o))}
                                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                              >
                                Accept €{Number(myOffer.CounterAmount).toLocaleString()}
                              </button>
                              <button
                                onClick={() => rejectCounter(myOffer.OfferID).then(o => setMyOffer(o))}
                                className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {myOffer.OfferStatus === 'Rejected' && (
                      <div>
                        <p className="text-sm text-slate-500 mb-3">Place a new offer:</p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Amount (€)"
                            value={offerAmount}
                            onChange={e => setOfferAmount(e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                          />
                          <button
                            onClick={handleOffer}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-slate-900 mb-3">Make an offer</h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount (€)"
                        min="1"
                        value={offerAmount}
                        onChange={e => { setOfferAmount(e.target.value); setOfferError('') }}
                        onKeyDown={e => { if (e.key === 'Enter') handleOffer() }}
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${offerError ? 'border-red-400' : 'border-slate-300'}`}
                      />
                      <button
                        onClick={handleOffer}
                        disabled={offerLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {offerLoading ? '…' : 'Send'}
                      </button>
                    </div>
                    {offerError && <p className="text-xs text-red-500 mt-1">{offerError}</p>}
                    <p className="text-xs text-slate-400 mt-2">Asking price: €{Number(listing.Price).toLocaleString()}</p>
                  </>
                )}
              </div>

              <button
                onClick={handleMessage}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                <MessageSquare size={18} /> Send message
              </button>

              <button
                onClick={toggleFav}
                className="w-full flex items-center justify-center gap-2 border border-slate-300 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                <Heart size={18} className={fav ? 'fill-red-500 text-red-500' : ''} />
                {fav ? 'Remove from favorites' : 'Save to favorites'}
              </button>
            </>
          )}

          {/* Not logged in */}
          {!user && isActive && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
              <p className="text-slate-600 text-sm mb-3">Sign in to make an offer or send a message</p>
              <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Sign in
              </button>
            </div>
          )}

          {/* Seller management */}
          {isSeller && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-900">Manage listing</h3>
              <button
                onClick={() => navigate(`/listings/${listing.ListingID}/edit`)}
                className="w-full flex items-center justify-between border border-slate-300 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50"
              >
                <span>Edit listing</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              {isActive && (
                <button
                  onClick={() => setShowSoldModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <CheckCircle size={16} /> Mark as Sold
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 py-2.5 rounded-lg text-sm hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete listing
              </button>
            </div>
          )}

          {/* Offers panel for seller */}
          {isSeller && offers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Received offers ({offers.length})</h3>
              <div className="space-y-3">
                {offers.map(o => (
                  <div key={o.OfferID} className="border border-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-600 text-lg">
                        €{Number(o.OfferedAmount).toLocaleString()}
                      </span>
                      <StatusBadge status={o.OfferStatus} />
                    </div>

                    {o.OfferStatus === 'Pending' && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptOffer(o.OfferID).then(refreshOffers)}
                            className="flex-1 text-xs bg-green-600 text-white py-1.5 rounded-lg hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectOffer(o.OfferID).then(refreshOffers)}
                            className="flex-1 text-xs border border-red-300 text-red-600 py-1.5 rounded-lg hover:bg-red-50"
                          >
                            Decline
                          </button>
                        </div>
                        {showCounterInput === o.OfferID ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="number"
                              placeholder="Counter offer (€)"
                              value={counterInput[o.OfferID] ?? ''}
                              onChange={e => setCounterInput(p => ({ ...p, [o.OfferID]: e.target.value }))}
                              className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                            />
                            <button
                              onClick={async () => {
                                await counterOffer(o.OfferID, Number(counterInput[o.OfferID]))
                                setShowCounterInput(null)
                                refreshOffers()
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                            >
                              Send
                            </button>
                            <button
                              onClick={() => setShowCounterInput(null)}
                              className="text-xs text-slate-500 px-2"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCounterInput(o.OfferID)}
                            className="text-xs text-blue-600 hover:underline text-center"
                          >
                            + Make counter offer
                          </button>
                        )}
                      </div>
                    )}

                    {o.OfferStatus === 'Countered' && o.CounterAmount && (
                      <p className="text-xs text-slate-500">
                        Your counter offer: €{Number(o.CounterAmount).toLocaleString()} — awaiting response
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report & Admin */}
          <div className="flex gap-2">
            {user && !isSeller && (
              <button
                onClick={() => setShowReport(true)}
                className="flex-1 flex items-center justify-center gap-1.5 text-slate-500 border border-slate-200 py-2 rounded-xl text-sm hover:bg-slate-50"
              >
                <Flag size={15} /> Report
              </button>
            )}
            {isAdmin && !isSeller && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 flex items-center justify-center gap-1.5 text-red-600 border border-red-200 py-2 rounded-xl text-sm hover:bg-red-50"
              >
                <Trash2 size={15} /> Admin: Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mark sold modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-900 mb-1">Mark as Sold</h3>
            <p className="text-sm text-slate-500 mb-4">The listing will be hidden from search and no longer accept offers.</p>
            <input
              type="number"
              placeholder="Final selling price (optional)"
              value={soldPrice}
              onChange={e => setSoldPrice(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleMarkSold} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium">
                Confirm
              </button>
              <button onClick={() => setShowSoldModal(false)} className="flex-1 border border-slate-300 py-2 rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900">Delete listing?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              This will permanently delete{' '}
              <span className="font-medium text-slate-700">
                {listing.model?.brand?.Name} {listing.model?.Name} {listing.ManufacturingYear}
              </span>
              . This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Yes, delete it
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-slate-300 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <ReportModal listingId={listing.ListingID} onClose={() => setShowReport(false)} />
      )}
    </div>
  )
}
