import api from './client'

export interface Message {
  MessageID: number
  ConversationID: number
  SenderID: number
  Content: string
  SentAt: string
  IsRead: boolean
}

export interface ConversationSummary {
  ConversationID: number
  ListingID: number
  BuyerID: number
  SellerID: number
  CreatedAt: string
  listing_title: string
  other_party_name: string
  last_message: string | null
  unread_count: number
}

export interface Conversation {
  ConversationID: number
  ListingID: number
  BuyerID: number
  SellerID: number
  CreatedAt: string
  listing_title: string
  other_party_name: string
  messages: Message[]
}

export const startConversation = (listing_id: number) =>
  api.post<Conversation>(`/conversations/${listing_id}`).then(r => r.data)

export const getMyConversations = () =>
  api.get<ConversationSummary[]>('/conversations').then(r => r.data)

export const getConversation = (id: number) =>
  api.get<Conversation>(`/conversations/${id}`).then(r => r.data)

export const sendMessage = (conversation_id: number, content: string) =>
  api.post<Message>(`/conversations/${conversation_id}/messages`, { content }).then(r => r.data)

export const markRead = (conversation_id: number) =>
  api.patch(`/conversations/${conversation_id}/messages/read`)
