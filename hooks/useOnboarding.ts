'use client'

import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { HINT_TOTAL } from '@/components/OnboardingCallout'

const LS_KEY = 'voyalogue_hint_step'

const LS_DONE_KEY = 'voyalogue_onboarding_done'

export function useOnboarding() {
  const { user } = useAuthStore()

  // lazy initializer — localStorage를 렌더 전에 동기 읽어 지연 없이 바로 표시
  const [hintStep, setHintStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    if (localStorage.getItem(LS_DONE_KEY)) return 0        // 완료된 유저
    const saved = localStorage.getItem(LS_KEY)
    if (saved !== null) return parseInt(saved, 10) || 0    // 진행 중
    return 0                                                // 신규: Firestore 확인 후 결정
  })

  useEffect(() => {
    if (!user) return
    if (localStorage.getItem(LS_DONE_KEY)) return          // 이미 완료
    if (localStorage.getItem(LS_KEY) !== null) return      // 이미 진행 중 (lazy로 처리됨)

    // 신규 유저 — Firestore 확인
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        if (snap.data()?.onboardingDone) {
          localStorage.setItem(LS_DONE_KEY, '1')
          setHintStep(0)
        } else {
          localStorage.setItem(LS_KEY, '1')
          setHintStep(1)
        }
      })
      .catch(() => {
        localStorage.setItem(LS_KEY, '1')
        setHintStep(1)
      })
  }, [user?.uid])

  const finish = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    localStorage.setItem(LS_DONE_KEY, '1')
    if (user) {
      updateDoc(doc(db, 'users', user.uid), { onboardingDone: true }).catch(() => {})
    }
    setHintStep(0)
  }, [user])

  const nextHint = useCallback(() => {
    setHintStep(prev => {
      const next = prev + 1
      if (next > HINT_TOTAL) {
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
    finish()
  }, [finish])

  const jumpToStep = useCallback((n: number) => {
    if (n > HINT_TOTAL) {
      finish()
      return
    }
    localStorage.setItem(LS_KEY, String(n))
    setHintStep(n)
  }, [finish])

  return { hintStep, nextHint, skipHint, jumpToStep }
}
