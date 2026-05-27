import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { getBrands, getModels, searchListings } from '../api/listings'
import type { Brand, CarModel, Listing } from '../api/listings'
import { getFavoriteIds } from '../api/favorites'
import ListingCard from '../components/ListingCard'
import { useAuth } from '../context/AuthContext'

const inputCls = "bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 dark:focus:ring-orange-400/40 transition-all w-full"

export default function HomePage() {
  const { user } = useAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [favIds, setFavIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    keyword: '',
    brand_id: '',
    model_id: '',
    min_price: '',
    max_price: '',
    year_from: '',
    year_to: '',
  })

  useEffect(() => {
    getBrands().then(setBrands)
    fetchListings()
  }, [])

  useEffect(() => {
    if (!user) { setFavIds(new Set()); return }
    getFavoriteIds().then(ids => setFavIds(new Set(ids)))
  }, [user])

  useEffect(() => {
    if (filters.brand_id) {
      getModels(Number(filters.brand_id)).then(setModels)
    } else {
      setModels([])
    }
  }, [filters.brand_id])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.brand_id) params.brand_id = Number(filters.brand_id)
      if (filters.model_id) params.model_id = Number(filters.model_id)
      if (filters.min_price) params.min_price = Number(filters.min_price)
      if (filters.max_price) params.max_price = Number(filters.max_price)
      if (filters.year_from) params.year_from = Number(filters.year_from)
      if (filters.year_to) params.year_to = Number(filters.year_to)
      const data = await searchListings(params)
      setListings(data)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    const empty = { keyword: '', brand_id: '', model_id: '', min_price: '', max_price: '', year_from: '', year_to: '' }
    setFilters(empty)
    setModels([])
    searchListings({}).then(setListings)
  }

  const handleFavoriteToggle = (listingId: number, newState: boolean) => {
    setFavIds(prev => {
      const next = new Set(prev)
      if (newState) next.add(listingId)
      else next.delete(listingId)
      return next
    })
  }

  const hasFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          Find your{' '}
          <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            perfect car
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Search thousands of verified listings</p>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl p-5 mb-8 shadow-xl shadow-black/5 dark:shadow-black/25">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-medium text-sm">
          <SlidersHorizontal size={15} className="text-orange-500" />
          Search filters
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
          <select
            value={filters.brand_id}
            onChange={e => setFilters({ ...filters, brand_id: e.target.value, model_id: '' })}
            className={inputCls}
          >
            <option value="">All brands</option>
            {brands.map(b => <option key={b.BrandID} value={b.BrandID}>{b.Name}</option>)}
          </select>

          <select
            value={filters.model_id}
            onChange={e => setFilters({ ...filters, model_id: e.target.value })}
            disabled={!filters.brand_id}
            className={`${inputCls} disabled:opacity-50`}
          >
            <option value="">All models</option>
            {models.map(m => <option key={m.ModelID} value={m.ModelID}>{m.Name}</option>)}
          </select>

          <input
            placeholder="Min price (€)"
            value={filters.min_price}
            onChange={e => setFilters({ ...filters, min_price: e.target.value })}
            type="number"
            min="0"
            className={inputCls}
          />

          <input
            placeholder="Max price (€)"
            value={filters.max_price}
            onChange={e => setFilters({ ...filters, max_price: e.target.value })}
            type="number"
            min="0"
            className={inputCls}
          />

          <input
            placeholder="Year from"
            value={filters.year_from}
            onChange={e => setFilters({ ...filters, year_from: e.target.value })}
            type="number"
            min="1900"
            max="2026"
            className={inputCls}
          />

          <input
            placeholder="Year to"
            value={filters.year_to}
            onChange={e => setFilters({ ...filters, year_to: e.target.value })}
            type="number"
            min="1900"
            max="2026"
            className={inputCls}
          />

          <input
            placeholder="Keyword…"
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') fetchListings() }}
            className={`${inputCls} col-span-2`}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 transition-all duration-200"
          >
            <Search size={15} /> Search
          </button>
          {hasFilters && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Searching…' : `${listings.length} listing${listings.length !== 1 ? 's' : ''} found`}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-white/60 dark:border-white/10 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-800" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center text-slate-500 dark:text-slate-400 py-20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/10 shadow-xl shadow-black/5">
          <Search size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No listings found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
          <button
            onClick={reset}
            className="mt-4 text-orange-500 dark:text-orange-400 text-sm hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(l => (
            <ListingCard
              key={l.ListingID}
              listing={l}
              isFavorited={favIds.has(l.ListingID)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
