import { Link } from 'react-router-dom'
import { Heart, Gauge, Calendar, Zap } from 'lucide-react'
import type { Listing } from '../api/listings'
import { useAuth } from '../context/AuthContext'
import { addFavorite, removeFavorite } from '../api/favorites'
import { useState, useEffect } from 'react'

interface Props {
  listing: Listing
  isFavorited?: boolean
  onFavoriteToggle?: (listingId: number, newState: boolean) => void
}

export default function ListingCard({ listing, isFavorited = false, onFavoriteToggle }: Props) {
  const { user } = useAuth()
  const [fav, setFav] = useState(isFavorited)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!loading) setFav(isFavorited)
  }, [isFavorited])

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
      className="group block bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/25 hover:shadow-xl hover:shadow-orange-500/10 dark:hover:shadow-orange-500/15 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.ImageURL}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600 text-sm">
            No image
          </div>
        )}
        {listing.StatusID !== 1 && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-lg">
            Sold
          </span>
        )}
        {user && (
          <button
            onClick={toggleFavorite}
            className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-110 ${
              fav
                ? 'bg-rose-50/90 dark:bg-rose-900/60'
                : 'bg-white/80 dark:bg-slate-800/80'
            }`}
          >
            <Heart
              size={15}
              className={fav ? 'fill-rose-500 text-rose-500' : 'text-slate-400 dark:text-slate-500'}
            />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
          {listing.model?.brand?.Name} {listing.model?.Name} {listing.ManufacturingYear}
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent font-bold text-xl mt-1">
          €{Number(listing.Price).toLocaleString()}
        </div>
        <div className="flex gap-3 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Gauge size={11} className="text-slate-400 dark:text-slate-500" />
            {listing.Mileage.toLocaleString()} km
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-slate-400 dark:text-slate-500" />
            {listing.ManufacturingYear}
          </span>
          <span className="flex items-center gap-1">
            <Zap size={11} className="text-slate-400 dark:text-slate-500" />
            {listing.HorsePower} HP
          </span>
        </div>
      </div>
    </Link>
  )
}
