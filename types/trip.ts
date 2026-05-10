export interface TripMeta {
  id: string
  title: string
  city: string
  country: string
  startDate: string
  endDate: string
  coverImage?: string
  emoji?: string
  createdAt: string
  updatedAt: string
  exchangeRate?: { currency: string; krwPer100: number }
  totalRating?: number
}

export interface SavedCity {
  city: string
  country: string
  emoji?: string
  coverImage?: string
  tripCount: number
  lastVisited: string
}
