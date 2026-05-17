import { create } from 'zustand'
import type { User } from 'firebase/auth'

type AuthStore = {
  user:    User | null
  loading: boolean
  avatarColor:    number | null
  avatarHexColor: string | null
  adFree:         boolean
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  setAvatarColor: (color: number | null) => void
  setAvatarHexColor: (hex: string | null) => void
  setAdFree: (v: boolean) => void
}

export const useAuthStore = create<AuthStore>(set => ({
  user:            null,
  loading:         true,
  avatarColor:     null,
  avatarHexColor:  null,
  adFree:          false,
  setUser:         user    => set({ user, loading: false }),
  setLoading:      loading => set({ loading }),
  setAvatarColor:  color   => set({ avatarColor: color }),
  setAvatarHexColor: hex   => set({ avatarHexColor: hex }),
  setAdFree:       v       => set({ adFree: v }),
}))
