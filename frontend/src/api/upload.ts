import api from './client'

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))
  const res = await api.post<{ urls: string[] }>('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.urls
}
