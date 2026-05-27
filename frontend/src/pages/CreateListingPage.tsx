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

const inputCls = "w-full bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 dark:focus:ring-orange-400/40 transition-all"
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
const panelCls = "bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 p-6"

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
      if (listing.model?.BrandID) {
        setBrandId(String(listing.model.BrandID))
      }
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
      setError(`You can add up to 5 photos (${remaining} slot${remaining !== 1 ? 's' : ''} remaining)`)
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

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.price || !form.model_id) { setError('Price and model are required'); return }
    if (Number(form.price) <= 0) { setError('Price must be positive'); return }
    setLoading(true)
    setError('')

    try {
      const newFiles = images.filter(img => img.file).map(img => img.file!)
      let uploadedUrls: string[] = []

      if (newFiles.length > 0) {
        setUploading(true)
        try {
          uploadedUrls = await uploadImages(newFiles)
        } catch (err: any) {
          setError(err?.response?.data?.detail ?? 'Error uploading images')
          setLoading(false)
          setUploading(false)
          return
        }
        setUploading(false)
      }

      let urlIndex = 0
      const finalImages: { url: string; isPrimary: boolean }[] = images.map(img => {
        if (img.file) return { url: uploadedUrls[urlIndex++], isPrimary: img.isPrimary }
        return { url: img.uploaded!, isPrimary: img.isPrimary }
      })

      const sortedUrls = [
        ...finalImages.filter(i => i.isPrimary),
        ...finalImages.filter(i => !i.isPrimary),
      ].map(i => i.url)

      const payload = {
        model_id: Number(form.model_id),
        manufacturing_year: Number(form.manufacturing_year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        horse_power: Number(form.horse_power),
        description: form.description,
        image_urls: sortedUrls,
        primary_image_index: 0,
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
        setError(detail ?? 'Save failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
        {isEdit ? 'Edit listing' : 'New listing'}
      </h1>

      <form onSubmit={submit} className="space-y-5">
        {/* Photos */}
        <div className={panelCls}>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">Photos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Up to 5 photos · Click the star to set the cover photo</p>

          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div
                key={i}
                className={`relative w-28 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                  img.isPrimary
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'border-slate-200 dark:border-white/10'
                }`}
              >
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
                  <button type="button" onClick={() => setPrimary(i)} className="p-1.5 bg-white/90 rounded-full shadow" title="Set as cover">
                    {img.isPrimary
                      ? <Star size={13} className="fill-orange-400 text-orange-400" />
                      : <StarOff size={13} className="text-slate-600" />}
                  </button>
                  <button type="button" onClick={() => removeImage(i)} className="p-1.5 bg-white/90 rounded-full shadow">
                    <X size={13} className="text-red-500" />
                  </button>
                </div>
                {img.isPrimary && (
                  <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] font-bold text-center py-0.5 tracking-wide uppercase">
                    Cover
                  </span>
                )}
              </div>
            ))}

            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-orange-400 dark:hover:border-orange-400/60 hover:bg-orange-50 dark:hover:bg-orange-500/5 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500 hover:text-orange-500 transition-all"
              >
                <ImagePlus size={20} />
                <span className="text-xs">Add photo</span>
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
            <p className="text-xs text-orange-500 mt-2 flex items-center gap-1.5">
              <Upload size={12} /> Uploading images…
            </p>
          )}
        </div>

        {/* Vehicle details */}
        <div className={panelCls}>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Vehicle details</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Brand</label>
              <select
                value={brandId}
                onChange={e => { setBrandId(e.target.value); setForm({ ...form, model_id: '' }) }}
                className={inputCls}
              >
                <option value="">Select brand</option>
                {brands.map(b => <option key={b.BrandID} value={b.BrandID}>{b.Name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Model *</label>
              <select
                value={form.model_id}
                onChange={e => setForm({ ...form, model_id: e.target.value })}
                required
                disabled={!brandId}
                className={`${inputCls} disabled:opacity-50`}
              >
                <option value="">Select model</option>
                {models.map(m => <option key={m.ModelID} value={m.ModelID}>{m.Name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>Year *</label>
              <input
                type="number" required placeholder="2020"
                min="1900" max="2026"
                value={form.manufacturing_year}
                onChange={e => setForm({ ...form, manufacturing_year: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Price (€) *</label>
              <input
                type="number" required min="1" placeholder="15000"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Mileage (km) *</label>
              <input
                type="number" required min="0" placeholder="50000"
                value={form.mileage}
                onChange={e => setForm({ ...form, mileage: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelCls}>Power (HP) *</label>
            <input
              type="number" required min="1" placeholder="150"
              value={form.horse_power}
              onChange={e => setForm({ ...form, horse_power: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the car's condition, features, service history…"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-orange-500/25 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (uploading ? 'Uploading images…' : 'Saving…') : (isEdit ? 'Save changes' : 'Publish listing')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
