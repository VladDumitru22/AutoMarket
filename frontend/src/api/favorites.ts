import api from './client'
import type { Listing } from './listings'

export const getFavorites = () =>
  api.get<Listing[]>('/favorites').then(r => r.data)

export const getFavoriteIds = () =>
  api.get<{ ids: number[] }>('/favorites/ids').then(r => r.data.ids)

export const addFavorite = (listing_id: number) =>
  api.post(`/favorites/${listing_id}`)

export const removeFavorite = (listing_id: number) =>
  api.delete(`/favorites/${listing_id}`)
