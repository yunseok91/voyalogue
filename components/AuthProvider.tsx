'use client'

import { useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp, runTransaction, increment, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setAdFree } = useAuthStore()
  const snapUnsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      /* 이전 실시간 리스너 정리 */
      snapUnsubRef.current?.()
      snapUnsubRef.current = null

      if (!user) {
        setUser(null)
        return
      }

      /* 비동기 체크가 완료될 때까지 로딩 유지 — AuthGuard 조기 리다이렉트 방지 */
      setLoading(true)

      const userRef     = doc(db, 'users', user.uid)
      const betaRef     = doc(db, 'config', 'betaSettings')

      const snap = await getDoc(userRef).catch(() => null)
      const isDeletedUser = snap?.exists() === true && snap.data().deleted === true
      const isNewUser = !snap?.exists()

      if (snap && snap.exists() && snap.data().suspended === true) {
        await signOut(auth).catch(() => {})
        localStorage.setItem('account_suspended', 'true')
        window.location.href = '/auth?suspended=1'
        return
      }

      /* 탈퇴 유저 처리 — lastSignInTime으로 신규 로그인 여부 판별 */
      let isReregistering = false
      if (isDeletedUser) {
        try {
          const lastSignIn = new Date(user.metadata.lastSignInTime ?? 0).getTime()
          const isFreshLogin = Date.now() - lastSignIn < 30_000

          if (isFreshLogin) {
            // 방금 직접 로그인 → 재등록 허용, 로컬 플래그 초기화
            isReregistering = true
            localStorage.removeItem('voyalogue_allow_reregister')
            localStorage.removeItem('voyalogue_onboarding_done')
            localStorage.removeItem('voyalogue_hint_step')
            localStorage.removeItem('voyagelogue_welcomed')
          } else {
            // 캐시된 세션으로 접근 → 강제 로그아웃 후 랜딩페이지
            await signOut(auth).catch(() => {})
            window.location.href = '/'
            return
          }
        } catch {
          await signOut(auth).catch(() => {})
          window.location.href = '/'
          return
        }
      }

      /* 신규 유저(진짜 신규): 베타 한도 확인 후 카운터 증가
         삭제 후 재가입(isDeletedUser)은 베타 카운터 증가 제외 */
      if (isNewUser) {
        try {
          const betaSnap = await getDoc(betaRef)
          if (betaSnap.exists()) {
            const { betaEnabled, maxUsers, userCount } = betaSnap.data() as {
              betaEnabled?: boolean
              maxUsers?: number
              userCount?: number
            }
            if (betaEnabled && maxUsers != null && (userCount ?? 0) >= maxUsers) {
              await signOut(auth).catch(() => {})
              window.location.href = '/auth?error=beta_full'
              return
            }
          }
          /* 한도 내: 카운터 원자적 증가 */
          await runTransaction(db, async tx => {
            tx.set(betaRef, { userCount: increment(1) }, { merge: true })
          })
        } catch { /* 베타 설정 없으면 무시 */ }
      }

      /* Google 등 소셜 로그인 후 photoURL이 stale할 수 있어 강제 갱신 */
      await user.reload().catch(() => {})
      const freshUser = auth.currentUser ?? user

      /* user.photoURL이 null이면 providerData → Firestore 순으로 fallback 탐색 */
      const resolvedPhoto =
        freshUser.photoURL ||
        freshUser.providerData.find(p => p.photoURL)?.photoURL ||
        (snap?.exists() ? (snap.data().photoURL as string | undefined) : undefined) ||
        ''

      /* Firebase Auth User 객체 자체에 photoURL을 반영 (profile/trips 페이지 등 직접 참조하는 곳 대응) */
      if (!freshUser.photoURL && resolvedPhoto) {
        await updateProfile(freshUser, { photoURL: resolvedPhoto }).catch(() => {})
      }

      /* updateProfile 후 최신 User 객체를 다시 참조 */
      const finalUser = auth.currentUser ?? freshUser

      setUser(finalUser)
      if (snap?.exists()) setAdFree(snap.data().adFree === true)

      await setDoc(
        userRef,
        {
          displayName: finalUser.displayName ?? '',
          email:       finalUser.email ?? '',
          photoURL:    resolvedPhoto,
          lastLoginAt: serverTimestamp(),
        },
        // 재등록 시: merge: false로 deleted 플래그 완전 제거 (데이터 초기화)
        { merge: !isReregistering }
      ).catch(() => {})

      /* 어드민이 deleted/suspended 처리하면 즉시 강제 로그아웃 */
      snapUnsubRef.current = onSnapshot(userRef, docSnap => {
        if (!docSnap.exists()) return
        const data = docSnap.data()
        if (data.deleted === true) {
          snapUnsubRef.current?.()
          snapUnsubRef.current = null
          signOut(auth).catch(() => {})
          window.location.href = '/'
        } else if (data.suspended === true) {
          snapUnsubRef.current?.()
          snapUnsubRef.current = null
          signOut(auth).catch(() => {})
          localStorage.setItem('account_suspended', 'true')
          window.location.href = '/auth?suspended=1'
        }
      })

    })
    return () => {
      unsub()
      snapUnsubRef.current?.()
    }
  }, [setUser])

  return <>{children}</>
}
