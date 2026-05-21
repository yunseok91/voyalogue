'use client'

import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

const LS_KEY = 'voyalogue_tour_step'

export function useOnboarding() {
  const { user } = useAuthStore()
  const [tourStep, setTourStep] = useState<number>(0)
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        const data = snap.data()
        if (data?.onboardingDone) {
          setTourStep(0)
        } else {
          setTourStep(1)
        }
      })
      .catch(() => setTourStep(1))
      .finally(() => setReady(true))
  }, [user?.uid])

  const skipTour = useCallback(async () => {
    setTourStep(0)
    if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY)
    if (user) {
      try { await updateDoc(doc(db, 'users', user.uid), { onboardingDone: true }) } catch {}
    }
  }, [user])

  const resetTour = useCallback(async () => {
    setTourStep(1)
    if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY)
    if (user) {
      try { await updateDoc(doc(db, 'users', user.uid), { onboardingDone: false }) } catch {}
    }
  }, [user])

  return { tourStep, ready, skipTour, resetTour }
}
