import api from './client'

export interface Offer {
  OfferID: number
  ListingID: number
  BuyerID: number
  OfferedAmount: string
  OfferDate: string
  IsAccepted: boolean
}

export const placeOffer = (listing_id: number, offered_amount: number) =>
  api.post<Offer>(`/offers/${listing_id}`, { offered_amount }).then(r => r.data)

export const getListingOffers = (listing_id: number) =>
  api.get<Offer[]>(`/offers/listing/${listing_id}`).then(r => r.data)

export const acceptOffer = (offer_id: number) =>
  api.post<Offer>(`/offers/${offer_id}/accept`).then(r => r.data)
