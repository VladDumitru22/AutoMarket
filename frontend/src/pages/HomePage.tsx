import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { getBrands, getModels, searchListings } from '../api/listings'
import type { Brand, CarModel, Listing } from '../api/listings'
import ListingCard from '../components/ListingCard'

export default function HomePage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [listings, setListings] = useState<Listing[]>([])
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
    setFilters({ keyword: '', brand_id: '', model_id: '', min_price: '', max_price: '', year_from: '', year_to: '' })
    setModels([])
    searchListings({}).then(setListings)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find your next car</h1>
        <p className="text-slate-500">Search through thousands of verified listings</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <select
            value={filters.brand_id}
            onChange={e => setFilters({ ...filters, brand_id: e.target.value, model_id: '' })}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All brands</option>
            {brands.map(b => <option key={b.BrandID} value={b.BrandID}>{b.Name}</option>)}
          </select>

          <select
            value={filters.model_id}
            onChange={e => setFilters({ ...filters, model_id: e.target.value })}
            disabled={!filters.brand_id}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
          >
            <option value="">All models</option>
            {models.map(m => <option key={m.ModelID} value={m.ModelID}>{m.Name}</option>)}
          </select>

          <input
            placeholder="Min price (€)"
            value={filters.min_price}
            onChange={e => setFilters({ ...filters, min_price: e.target.value })}
            type="number"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="Max price (€)"
            value={filters.max_price}
            onChange={e => setFilters({ ...filters, max_price: e.target.value })}
            type="number"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="Year from"
            value={filters.year_from}
            onChange={e => setFilters({ ...filters, year_from: e.target.value })}
            type="number"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="Year to"
            value={filters.year_to}
            onChange={e => setFilters({ ...filters, year_to: e.target.value })}
            type="number"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />

          <input
            placeholder="Search keyword..."
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm col-span-2"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Search size={16} /> Search
          </button>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-slate-500 py-16">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center text-slate-500 py-16">
          <p className="text-lg font-medium">No listings found</p>
          <p className="text-sm mt-1">Try resetting the filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(l => <ListingCard key={l.ListingID} listing={l} />)}
        </div>
      )}
    </div>
  )
}
