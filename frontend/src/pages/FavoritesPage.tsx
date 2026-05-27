import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFavorites } from '../api/favorites'
import type { Listing } from '../api/listings'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/ListingCard'
import { Heart } from 'lucide-react'

export default function FavoritesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getFavorites().then(setFavorites).finally(() => setLoading(false))
  }, [user])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Favorites</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-white/60 dark:border-white/10 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-800" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/10 shadow-xl shadow-black/5">
          <Heart size={44} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No favorites yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Save listings you like to compare them later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map(l => (
            <ListingCard
              key={l.ListingID}
              listing={l}
              isFavorited={true}
              onFavoriteToggle={() => setFavorites(prev => prev.filter(f => f.ListingID !== l.ListingID))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
