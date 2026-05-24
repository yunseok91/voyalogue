'use client'

import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

const LS_KEY = 'voyalogue_hint_step'

export function useOnboarding() {
  const { user } = useAuthStore()
  const [hintStep, setHintStep] = useState<number>(0)

  useEffect(() => {
    if (!user) return

    // localStorage에 진행 중인 단계가 있으면 그걸 쓴다
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
    if (saved !== null) {
      const n = parseInt(saved, 10)
      setHintStep(isNaN(n) ? 0 : n)
      return
    }

    // 없으면 Firestore에서 완료 여부 확인
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        if (snap.data()?.onboardingDone) {
          setHintStep(0)
        } else {
          setHintStep(1)
          localStorage.setItem(LS_KEY, '1')
        }
      })
      .catch(() => {
        setHintStep(1)
        localStorage.setItem(LS_KEY, '1')
      })
  }, [user?.uid])

  const nextHint = useCallback(() => {
    setHintStep(prev => {
      const next = prev + 1
      if (next > 4) {
        localStorage.removeItem(LS_KEY)
        if (user) {
          updateDoc(doc(db, 'users', user.uid), { onboardingDone: true }).catch(() => {})
        }
        return 0
      }
      localStorage.setItem(LS_KEY, String(next))
      return next
    })
  }, [user])

  const skipHint = useCallback(() => {
    setHintStep(0)
    localStorage.removeItem(LS_KEY)
    if (user) {
      updateDoc(doc(db, 'users', user.uid), { onboardingDone: true }).catch(() => {})
    }
  }, [user])

  return { hintStep, nextHint, skipHint }
}
