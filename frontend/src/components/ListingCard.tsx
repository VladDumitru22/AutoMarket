import { Link } from 'react-router-dom'
import { Heart, Gauge, Calendar, Zap } from 'lucide-react'
import type { Listing } from '../api/listings'
import { useAuth } from '../context/AuthContext'
import { addFavorite, removeFavorite } from '../api/favorites'
import { useState } from 'react'

interface Props {
  listing: Listing
  isFavorited?: boolean
  onFavoriteToggle?: (listingId: number, newState: boolean) => void
}

export default function ListingCard({ listing, isFavorited = false, onFavoriteToggle }: Props) {
  const { user } = useAuth()
  const [fav, setFav] = useState(isFavorited)
  const [loading, setLoading] = useState(false)

  if (isFavorited !== fav && !loading) {
    setFav(isFavorited)
  }

  const primaryImage = listing.images.find(i => i.IsPrimary) ?? listing.images[0]

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || loading) return
    setLoading(true)
    try {
      if (fav) {
        await removeFavorite(listing.ListingID)
        setFav(false)
        onFavoriteToggle?.(listing.ListingID, false)
      } else {
        await addFavorite(listing.ListingID)
        setFav(true)
        onFavoriteToggle?.(listing.ListingID, true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link
      to={`/listings/${listing.ListingID}`}
      className="block bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 bg-slate-100">
        {primaryImage ? (
          <img src={primaryImage.ImageURL} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">No image</div>
        )}
        {listing.StatusID !== 1 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Sold
          </span>
        )}
        {user && (
          <button
            onClick={toggleFavorite}
            className={`absolute top-2 right-2 p-1.5 rounded-full shadow transition-transform hover:scale-110 ${
              fav ? 'bg-red-50' : 'bg-white'
            }`}
          >
            <Heart
              size={16}
              className={fav ? 'fill-red-500 text-red-500' : 'text-slate-400'}
            />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="font-semibold text-slate-900 truncate">
          {listing.model?.brand?.Name} {listing.model?.Name} {listing.ManufacturingYear}
        </div>
        <div className="text-blue-600 font-bold text-lg mt-1">
          €{Number(listing.Price).toLocaleString()}
        </div>
        <div className="flex gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Gauge size={12} />{listing.Mileage.toLocaleString()} km</span>
          <span className="flex items-center gap-1"><Calendar size={12} />{listing.ManufacturingYear}</span>
          <span className="flex items-center gap-1"><Zap size={12} />{listing.HorsePower} HP</span>
        </div>
      </div>
    </Link>
  )
}
