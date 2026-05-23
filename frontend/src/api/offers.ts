import api from './client'

export interface Offer {
  OfferID: number
  ListingID: number
  BuyerID: number
  OfferedAmount: string
  OfferDate: string
  IsAccepted: boolean
  OfferStatus: 'Pending' | 'Accepted' | 'Rejected' | 'Countered'
  CounterAmount: string | null
}

export const placeOffer = (listing_id: number, offered_amount: number) =>
  api.post<Offer>(`/offers/${listing_id}`, { offered_amount }).then(r => r.data)

export const getListingOffers = (listing_id: number) =>
  api.get<Offer[]>(`/offers/listing/${listing_id}`).then(r => r.data)

export const getMyOffers = () =>
  api.get<Offer[]>('/offers/mine').then(r => r.data)

export const acceptOffer = (offer_id: number) =>
  api.post<Offer>(`/offers/${offer_id}/accept`).then(r => r.data)

export const rejectOffer = (offer_id: number) =>
  api.post<Offer>(`/offers/${offer_id}/reject`).then(r => r.data)

export const counterOffer = (offer_id: number, counter_amount: number) =>
  api.post<Offer>(`/offers/${offer_id}/counter`, { counter_amount }).then(r => r.data)

export const acceptCounter = (offer_id: number) =>
  api.post<Offer>(`/offers/${offer_id}/accept-counter`).then(r => r.data)

export const rejectCounter = (offer_id: number) =>
  api.post<Offer>(`/offers/${offer_id}/reject-counter`).then(r => r.data)
