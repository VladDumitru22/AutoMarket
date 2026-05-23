import api from './client'

export interface NotificationCount {
  unread_messages: number
  pending_offers: number
  counter_offers: number
  total: number
}

export const getNotificationCount = () =>
  api.get<NotificationCount>('/notifications/count').then(r => r.data)
