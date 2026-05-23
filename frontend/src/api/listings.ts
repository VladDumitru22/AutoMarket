import api from './client'

export interface Brand { BrandID: number; Name: string }
export interface CarModel { ModelID: number; BrandID: number; Name: string; brand?: Brand }
export interface ListingImage { ImageID: number; ImageURL: string; IsPrimary: boolean }
export interface Listing {
  ListingID: number
  SellerID: number
  ModelID: number
  ManufacturingYear: number
  Price: string
  Mileage: number
  HorsePower: number
  Description: string | null
  FinalSellingPrice: string | null
  CreatedAt: string
  StatusID: number
  images: ListingImage[]
  model: CarModel | null
}

export interface ListingCreate {
  model_id: number
  manufacturing_year: number
  price: number
  mileage: number
  horse_power: number
  description?: string
  image_urls?: string[]
}

export interface SearchParams {
  keyword?: string
  brand_id?: number
  model_id?: number
  min_price?: number
  max_price?: number
  year_from?: number
  year_to?: number
}

export const getBrands = () => api.get<Brand[]>('/listings/brands').then(r => r.data)
export const getModels = (brand_id?: number) =>
  api.get<CarModel[]>('/listings/models', { params: { brand_id } }).then(r => r.data)
export const searchListings = (params: SearchParams) =>
  api.get<Listing[]>('/listings', { params }).then(r => r.data)
export const getListing = (id: number) =>
  api.get<Listing>(`/listings/${id}`).then(r => r.data)
export const getMyListings = () =>
  api.get<Listing[]>('/listings/mine').then(r => r.data)
export const createListing = (data: ListingCreate) =>
  api.post<Listing>('/listings', data).then(r => r.data)
export const updateListing = (id: number, data: Partial<ListingCreate>) =>
  api.put<Listing>(`/listings/${id}`, data).then(r => r.data)
export const markSold = (id: number, final_price?: number) =>
  api.post<Listing>(`/listings/${id}/mark-sold`, null, { params: { final_price } }).then(r => r.data)
export const deleteListing = (id: number) =>
  api.delete(`/listings/${id}`)
