import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyListings } from '../api/listings'
import type { Listing } from '../api/listings'
import { useAuth } from '../context/AuthContext'
import { Plus } from 'lucide-react'
import ListingCard from '../components/ListingCard'

export default function MyListingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getMyListings().then(setListings).finally(() => setLoading(false))
  }, [user])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
        <Link
          to="/listings/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> Add listing
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg font-medium">No listings yet</p>
          <p className="text-sm mt-1">Create your first listing to start selling</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(l => <ListingCard key={l.ListingID} listing={l} />)}
        </div>
      )}
    </div>
  )
}
