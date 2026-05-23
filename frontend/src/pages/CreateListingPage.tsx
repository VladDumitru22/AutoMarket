import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getBrands, getModels, createListing, updateListing, getListing } from '../api/listings'
import type { Brand, CarModel } from '../api/listings'
import { useAuth } from '../context/AuthContext'

export default function CreateListingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [brandId, setBrandId] = useState('')
  const [form, setForm] = useState({
    model_id: '',
    manufacturing_year: '',
    price: '',
    mileage: '',
    horse_power: '',
    description: '',
    image_urls: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
    getBrands().then(setBrands)
  }, [])

  useEffect(() => {
    if (isEdit && id) {
      getListing(Number(id)).then(listing => {
        setForm({
          model_id: String(listing.ModelID),
          manufacturing_year: String(listing.ManufacturingYear),
          price: String(listing.Price),
          mileage: String(listing.Mileage),
          horse_power: String(listing.HorsePower),
          description: listing.Description ?? '',
          image_urls: listing.images.map(i => i.ImageURL).join('\n'),
        })
      })
    }
  }, [id])

  useEffect(() => {
    if (brandId) getModels(Number(brandId)).then(setModels)
    else setModels([])
  }, [brandId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.price || !form.model_id) { setError('Price and model are required'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        model_id: Number(form.model_id),
        manufacturing_year: Number(form.manufacturing_year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        horse_power: Number(form.horse_power),
        description: form.description,
        image_urls: form.image_urls ? form.image_urls.split('\n').map(s => s.trim()).filter(Boolean) : [],
      }
      if (isEdit && id) {
        await updateListing(Number(id), payload)
        navigate(`/listings/${id}`)
      } else {
        const listing = await createListing(payload)
        navigate(`/listings/${listing.ListingID}`)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to save listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{isEdit ? 'Edit listing' : 'New listing'}</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
            <select
              value={brandId}
              onChange={e => { setBrandId(e.target.value); setForm({ ...form, model_id: '' }) }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select brand</option>
              {brands.map(b => <option key={b.BrandID} value={b.BrandID}>{b.Name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
            <select
              value={form.model_id}
              onChange={e => setForm({ ...form, model_id: e.target.value })}
              required
              disabled={!brandId}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">Select model</option>
              {models.map(m => <option key={m.ModelID} value={m.ModelID}>{m.Name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Year *', key: 'manufacturing_year', placeholder: '2020' },
            { label: 'Price (€) *', key: 'price', placeholder: '15000' },
            { label: 'Mileage (km) *', key: 'mileage', placeholder: '50000' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type="number"
                required
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Horsepower (HP) *</label>
          <input
            type="number"
            required
            placeholder="150"
            value={form.horse_power}
            onChange={e => setForm({ ...form, horse_power: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the car..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image URLs (one per line)</label>
          <textarea
            rows={3}
            value={form.image_urls}
            onChange={e => setForm({ ...form, image_urls: e.target.value })}
            placeholder="https://example.com/car.jpg"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none font-mono"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create listing'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
