import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { getBrands, getModels, searchListings } from '../api/listings'
import type { Brand, CarModel, Listing } from '../api/listings'
import { getFavoriteIds } from '../api/favorites'
import ListingCard from '../components/ListingCard'
import { useAuth } from '../context/AuthContext'

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Găsește mașina ta</h1>
        <p className="text-slate-500">Caută printre mii de anunțuri verificate</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-medium text-sm">
          <SlidersHorizontal size={16} />
          Filtre de căutare
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <select
            value={filters.brand_id}
            onChange={e => setFilters({ ...filters, brand_id: e.target.value, model_id: '' })}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Toate mărcile</option>
            {brands.map(b => <option key={b.BrandID} value={b.BrandID}>{b.Name}</option>)}
          </select>

          <select
            value={filters.model_id}
            onChange={e => setFilters({ ...filters, model_id: e.target.value })}
            disabled={!filters.brand_id}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Toate modelele</option>
            {models.map(m => <option key={m.ModelID} value={m.ModelID}>{m.Name}</option>)}
          </select>

          <input
            placeholder="Preț minim (€)"
            value={filters.min_price}
            onChange={e => setFilters({ ...filters, min_price: e.target.value })}
            type="number"
            min="0"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="Preț maxim (€)"
            value={filters.max_price}
            onChange={e => setFilters({ ...filters, max_price: e.target.value })}
            type="number"
            min="0"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="An de la"
            value={filters.year_from}
            onChange={e => setFilters({ ...filters, year_from: e.target.value })}
            type="number"
            min="1900"
            max="2026"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="An până la"
            value={filters.year_to}
            onChange={e => setFilters({ ...filters, year_to: e.target.value })}
            type="number"
            min="1900"
            max="2026"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="Cuvânt cheie..."
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') fetchListings() }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm col-span-2"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Search size={16} /> Caută
          </button>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50"
          >
            Resetează
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">
          {loading ? 'Se caută...' : `${listings.length} anunț${listings.length !== 1 ? 'uri' : ''} găsite`}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-5 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-lg font-medium">Niciun anunț găsit</p>
          <p className="text-sm mt-1">Încearcă să resetezi filtrele</p>
          <button onClick={reset} className="mt-4 text-blue-600 text-sm hover:underline">
            Resetează filtrele
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
