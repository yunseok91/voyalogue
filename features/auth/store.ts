import { create } from 'zustand'
import type { User } from 'firebase/auth'

type AuthStore = {
  user:    User | null
  loading: boolean
  avatarColor:    number | null
  avatarHexColor: string | null
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  setAvatarColor: (color: number | null) => void
  setAvatarHexColor: (hex: string | null) => void
}

export const useAuthStore = create<AuthStore>(set => ({
  user:            null,
  loading:         true,
  avatarColor:     null,
  avatarHexColor:  null,
  setUser:         user    => set({ user, loading: false }),
  setLoading:      loading => set({ loading }),
  setAvatarColor:  color   => set({ avatarColor: color }),
  setAvatarHexColor: hex   => set({ avatarHexColor: hex }),
}))
