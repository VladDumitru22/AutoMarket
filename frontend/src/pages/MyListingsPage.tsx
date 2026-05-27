import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyListings } from '../api/listings'
import type { Listing } from '../api/listings'
import { useAuth } from '../context/AuthContext'
import { Plus, Car } from 'lucide-react'
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Listings</h1>
        <Link
          to="/listings/new"
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 transition-all duration-200"
        >
          <Plus size={16} /> Add listing
        </Link>
      </div>

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
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/10 shadow-xl shadow-black/5">
          <Car size={44} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No listings yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create your first listing to start selling</p>
          <Link
            to="/listings/new"
            className="inline-flex items-center gap-2 mt-5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-rose-600 transition-all"
          >
            <Plus size={15} /> Add your first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(l => <ListingCard key={l.ListingID} listing={l} />)}
        </div>
      )}
    </div>
  )
}
