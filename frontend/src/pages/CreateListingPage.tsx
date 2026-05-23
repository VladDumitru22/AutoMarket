import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getBrands, getModels, createListing, updateListing, getListing } from '../api/listings'
import type { Brand, CarModel } from '../api/listings'
import { uploadImages } from '../api/upload'
import { useAuth } from '../context/AuthContext'
import { Upload, X, Star, StarOff, ImagePlus } from 'lucide-react'

interface ImageSlot {
  file?: File
  preview: string
  uploaded?: string
  isPrimary: boolean
}

export default function CreateListingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [brandId, setBrandId] = useState('')
  const [images, setImages] = useState<ImageSlot[]>([])
  const [form, setForm] = useState({
    model_id: '',
    manufacturing_year: '',
    price: '',
    mileage: '',
    horse_power: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
    getBrands().then(setBrands)
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    getListing(Number(id)).then(listing => {
      setForm({
        model_id: String(listing.ModelID),
        manufacturing_year: String(listing.ManufacturingYear),
        price: String(listing.Price),
        mileage: String(listing.Mileage),
        horse_power: String(listing.HorsePower),
        description: listing.Description ?? '',
      })
      const existingImages: ImageSlot[] = listing.images.map((img, i) => ({
        preview: img.ImageURL,
        uploaded: img.ImageURL,
        isPrimary: !!img.IsPrimary || i === 0,
      }))
      setImages(existingImages)
    })
  }, [id])

  useEffect(() => {
    if (brandId) getModels(Number(brandId)).then(setModels)
    else setModels([])
  }, [brandId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 5 - images.length
    if (files.length > remaining) {
      setError(`Poți adăuga maximum 5 imagini (mai ai loc pentru ${remaining})`)
      return
    }
    setError('')
    const newSlots: ImageSlot[] = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && i === 0,
    }))
    setImages(prev => [...prev, ...newSlots])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index].isPrimary && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true }
      }
      return next
    })
  }

  const setPrimary = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.price || !form.model_id) { setError('Prețul și modelul sunt obligatorii'); return }
    if (Number(form.price) <= 0) { setError('Prețul trebuie să fie pozitiv'); return }
    setLoading(true)
    setError('')

    try {
      // Upload new files to Cloudinary
      const newFiles = images.filter(img => img.file).map(img => img.file!)
      let uploadedUrls: string[] = []

      if (newFiles.length > 0) {
        setUploading(true)
        try {
          uploadedUrls = await uploadImages(newFiles)
        } catch (err: any) {
          setError(err?.response?.data?.detail ?? 'Eroare la încărcarea imaginilor')
          setLoading(false)
          setUploading(false)
          return
        }
        setUploading(false)
      }

      // Build final URL list preserving primary order
      let urlIndex = 0
      const finalImages: { url: string; isPrimary: boolean }[] = images.map(img => {
        if (img.file) {
          return { url: uploadedUrls[urlIndex++], isPrimary: img.isPrimary }
        }
        return { url: img.uploaded!, isPrimary: img.isPrimary }
      })

      // Primary first
      const sortedUrls = [
        ...finalImages.filter(i => i.isPrimary),
        ...finalImages.filter(i => !i.isPrimary),
      ].map(i => i.url)

      const primaryIndex = 0

      const payload = {
        model_id: Number(form.model_id),
        manufacturing_year: Number(form.manufacturing_year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        horse_power: Number(form.horse_power),
        description: form.description,
        image_urls: sortedUrls,
        primary_image_index: primaryIndex,
      }

      if (isEdit && id) {
        await updateListing(Number(id), payload)
        navigate(`/listings/${id}`)
      } else {
        const listing = await createListing(payload)
        navigate(`/listings/${listing.ListingID}`)
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg.replace('Value error, ', '')).join('. '))
      } else {
        setError(detail ?? 'Salvare eșuată')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {isEdit ? 'Editează anunțul' : 'Anunț nou'}
      </h1>

      <form onSubmit={submit} className="space-y-6">
        {/* Images */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Fotografii</h2>
          <p className="text-xs text-slate-500 mb-4">Maximum 3 fotografii · Click pe steluță pentru a seta imaginea principală</p>

          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className={`relative w-28 h-24 rounded-xl overflow-hidden border-2 ${img.isPrimary ? 'border-blue-500' : 'border-slate-200'}`}>
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className="p-1 bg-white/90 rounded-full"
                    title="Setează ca principală"
                  >
                    {img.isPrimary
                      ? <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      : <StarOff size={14} className="text-slate-600" />
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="p-1 bg-white/90 rounded-full"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
                {img.isPrimary && (
                  <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] text-center py-0.5">
                    Principală
                  </span>
                )}
              </div>
            ))}

            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-xs">Adaugă</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading && (
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              <Upload size={12} /> Se încarcă imaginile...
            </p>
          )}
        </div>

        {/* Car details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Detalii vehicul</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marcă</label>
              <select
                value={brandId}
                onChange={e => { setBrandId(e.target.value); setForm({ ...form, model_id: '' }) }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Selectează marca</option>
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
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Selectează modelul</option>
                {models.map(m => <option key={m.ModelID} value={m.ModelID}>{m.Name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">An fabricație *</label>
              <input
                type="number"
                required
                placeholder="2020"
                min="1900"
                max="2026"
                value={form.manufacturing_year}
                onChange={e => setForm({ ...form, manufacturing_year: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preț (€) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="15000"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kilometraj *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="50000"
                value={form.mileage}
                onChange={e => setForm({ ...form, mileage: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Putere (CP) *</label>
            <input
              type="number"
              required
              min="1"
              placeholder="150"
              value={form.horse_power}
              onChange={e => setForm({ ...form, horse_power: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descriere</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Descrie starea mașinii, dotările, istoricul de service..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (uploading ? 'Se încarcă imaginile...' : 'Se salvează...') : (isEdit ? 'Salvează modificările' : 'Publică anunțul')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50"
          >
            Anulează
          </button>
        </div>
      </form>
    </div>
  )
}
