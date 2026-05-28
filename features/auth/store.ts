import { create } from 'zustand'
import type { User } from 'firebase/auth'

type AuthStore = {
  user:    User | null
  loading: boolean
  avatarColor:       number | null
  avatarHexColor:    string | null
  adFree:            boolean
  preferredCurrency: string
  onboardingPaused:  boolean
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  setAvatarColor: (color: number | null) => void
  setAvatarHexColor: (hex: string | null) => void
  setAdFree: (v: boolean) => void
  setPreferredCurrency: (v: string) => void
  setOnboardingPaused: (v: boolean) => void
}

export const useAuthStore = create<AuthStore>(set => ({
  user:              null,
  loading:           true,
  avatarColor:       null,
  avatarHexColor:    null,
  adFree:            false,
  preferredCurrency: typeof window !== 'undefined' ? (localStorage.getItem('voyalogue_currency') ?? 'KRW') : 'KRW',
  onboardingPaused:  false,
  setUser:           user    => set({ user, loading: false }),
  setLoading:        loading => set({ loading }),
  setAvatarColor:    color   => set({ avatarColor: color }),
  setAvatarHexColor: hex     => set({ avatarHexColor: hex }),
  setAdFree:         v       => set({ adFree: v }),
  setPreferredCurrency: v    => set({ preferredCurrency: v }),
  setOnboardingPaused: v     => set({ onboardingPaused: v }),
}))
