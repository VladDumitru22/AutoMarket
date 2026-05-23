import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing, markSold, deleteListing } from '../api/listings'
import type { Listing } from '../api/listings'
import { placeOffer, getListingOffers, acceptOffer } from '../api/offers'
import type { Offer } from '../api/offers'
import { startConversation } from '../api/conversations'
import { addFavorite, removeFavorite } from '../api/favorites'
import { useAuth } from '../context/AuthContext'
import { Heart, MessageSquare, Gauge, Calendar, Zap, Trash2, CheckCircle } from 'lucide-react'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState<Listing | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [offerAmount, setOfferAmount] = useState('')
  const [fav, setFav] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [soldPrice, setSoldPrice] = useState('')
  const [showSoldModal, setShowSoldModal] = useState(false)

  const isSeller = user && listing && user.UserID === listing.SellerID

  useEffect(() => {
    if (!id) return
    getListing(Number(id)).then(setListing)
  }, [id])

  useEffect(() => {
    if (isSeller && listing) {
      getListingOffers(listing.ListingID).then(setOffers).catch(() => {})
    }
  }, [isSeller, listing])

  if (!listing) return <div className="text-center py-20 text-slate-500">Loading...</div>

  const handleOffer = async () => {
    if (!user) { navigate('/login'); return }
    if (!offerAmount) return
    await placeOffer(listing.ListingID, Number(offerAmount))
    setOfferAmount('')
    alert('Offer placed successfully!')
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
    if (!confirm('Delete this listing?')) return
    await deleteListing(listing.ListingID)
    navigate('/my-listings')
  }

  const toggleFav = async () => {
    if (!user) { navigate('/login'); return }
    if (fav) { await removeFavorite(listing.ListingID); setFav(false) }
    else { await addFavorite(listing.ListingID); setFav(true) }
  }

  const isActive = listing.StatusID === 1

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Images */}
        <div className="lg:col-span-2">
          <div className="bg-slate-100 rounded-xl overflow-hidden h-80 mb-3">
            {listing.images[activeImage] ? (
              <img
                src={listing.images[activeImage].ImageURL}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No image</div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.images.map((img, i) => (
                <button
                  key={img.ImageID}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${i === activeImage ? 'border-blue-500' : 'border-transparent'}`}
                >
                  <img src={img.ImageURL} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="mt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {listing.model?.Name} {listing.ManufacturingYear}
                </h1>
                {!isActive && (
                  <span className="inline-block mt-1 bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">Sold</span>
                )}
              </div>
              <div className="text-2xl font-bold text-blue-600">€{Number(listing.Price).toLocaleString()}</div>
            </div>

            <div className="flex gap-4 mt-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Gauge size={16} />{listing.Mileage.toLocaleString()} km</span>
              <span className="flex items-center gap-1.5"><Calendar size={16} />{listing.ManufacturingYear}</span>
              <span className="flex items-center gap-1.5"><Zap size={16} />{listing.HorsePower} HP</span>
            </div>

            {listing.Description && (
              <div className="mt-4">
                <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{listing.Description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {!isSeller && isActive && user && (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Make an offer</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount (€)"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button onClick={handleOffer} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Send
                  </button>
                </div>
              </div>

              <button
                onClick={handleMessage}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800"
              >
                <MessageSquare size={18} /> Send message
              </button>

              <button
                onClick={toggleFav}
                className="w-full flex items-center justify-center gap-2 border border-slate-300 py-3 rounded-xl font-medium hover:bg-slate-50"
              >
                <Heart size={18} className={fav ? 'fill-red-500 text-red-500' : ''} />
                {fav ? 'Remove from favorites' : 'Save to favorites'}
              </button>
            </>
          )}

          {/* Seller actions */}
          {isSeller && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Manage listing</h3>
              <button
                onClick={() => navigate(`/listings/${listing.ListingID}/edit`)}
                className="w-full border border-slate-300 py-2 rounded-lg text-sm hover:bg-slate-50"
              >
                Edit listing
              </button>
              {isActive && (
                <button
                  onClick={() => setShowSoldModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  <CheckCircle size={16} /> Mark as sold
                </button>
              )}
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 py-2 rounded-lg text-sm hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}

          {/* Offers for seller */}
          {isSeller && offers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Offers ({offers.length})</h3>
              <div className="space-y-2">
                {offers.map(o => (
                  <div key={o.OfferID} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-600">€{Number(o.OfferedAmount).toLocaleString()}</span>
                    {o.IsAccepted ? (
                      <span className="text-green-600 text-xs">Accepted</span>
                    ) : (
                      <button
                        onClick={() => acceptOffer(o.OfferID).then(() => getListingOffers(listing.ListingID).then(setOffers))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && !isSeller && (
            <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 py-2 rounded-xl text-sm hover:bg-red-50">
              <Trash2 size={16} /> Admin: Remove
            </button>
          )}
        </div>
      </div>

      {/* Mark sold modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80">
            <h3 className="font-bold text-slate-900 mb-3">Mark as sold</h3>
            <input
              type="number"
              placeholder="Final selling price (optional)"
              value={soldPrice}
              onChange={e => setSoldPrice(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleMarkSold} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm">Confirm</button>
              <button onClick={() => setShowSoldModal(false)} className="flex-1 border border-slate-300 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
