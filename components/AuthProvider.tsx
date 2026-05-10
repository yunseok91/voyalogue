'use client'

import { useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        setUser(null)
        return
      }

      const userRef = doc(db, 'users', user.uid)

      const snap = await getDoc(userRef).catch(() => null)
      if (snap && snap.exists() && snap.data().suspended === true) {
        await signOut(auth).catch(() => {})
        localStorage.setItem('account_suspended', 'true')
        window.location.href = '/auth?suspended=1'
        return
      }

      setUser(user)

      await setDoc(
        userRef,
        {
          displayName: user.displayName ?? '',
          email:       user.email ?? '',
          photoURL:    user.photoURL ?? '',
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {})
    })
    return unsub
  }, [setUser])

  return <>{children}</>
}
