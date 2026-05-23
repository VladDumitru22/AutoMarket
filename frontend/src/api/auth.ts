import api from './client'

export interface User {
  UserID: number
  Email: string
  FirstName: string | null
  LastName: string | null
  RoleID: number
}

export const register = (data: { email: string; password: string; first_name?: string; last_name?: string }) =>
  api.post<User>('/auth/register', data).then(r => r.data)

export const login = (email: string, password: string) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return api.post<{ access_token: string; token_type: string }>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(r => r.data)
}
