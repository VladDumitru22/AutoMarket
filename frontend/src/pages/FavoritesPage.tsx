import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFavorites } from '../api/favorites'
import type { Listing } from '../api/listings'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/ListingCard'

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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Favorites</h1>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm mt-1">Save listings you like to compare them later</p>
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
