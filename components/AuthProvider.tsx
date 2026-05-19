'use client'

import { useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp, runTransaction, increment } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setAdFree } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        setUser(null)
        return
      }

      /* 비동기 체크가 완료될 때까지 로딩 유지 — AuthGuard 조기 리다이렉트 방지 */
      setLoading(true)

      const userRef     = doc(db, 'users', user.uid)
      const betaRef     = doc(db, 'config', 'betaSettings')

      const snap = await getDoc(userRef).catch(() => null)
      const isNewUser = !snap?.exists()

      if (snap && snap.exists() && snap.data().suspended === true) {
        await signOut(auth).catch(() => {})
        localStorage.setItem('account_suspended', 'true')
        window.location.href = '/auth?suspended=1'
        return
      }

      /* 신규 유저: 베타 한도 확인 후 카운터 증가 */
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

      /* user.photoURL이 null인 경우 providerData(Google 등)에서 fallback */
      const photoURL =
        freshUser.photoURL ||
        freshUser.providerData.find(p => p.photoURL)?.photoURL ||
        (snap?.exists() ? (snap.data().photoURL as string | undefined) : undefined) ||
        ''

      setUser(freshUser)
      if (snap?.exists()) setAdFree(snap.data().adFree === true)

      await setDoc(
        userRef,
        {
          displayName: freshUser.displayName ?? '',
          email:       freshUser.email ?? '',
          photoURL,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {})

      /* 신규 유저: 샘플 여행 생성 (비동기 — 실패해도 로그인 차단 없음) */
      if (isNewUser) {
        import('@/lib/seedSampleTrip')
          .then(({ seedSampleTrip }) =>
            seedSampleTrip(freshUser.uid, freshUser.displayName ?? '나')
          )
          .catch(() => {})
      }
    })
    return unsub
  }, [setUser])

  return <>{children}</>
}
