'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { Suspense } from 'react'

type Status = 'confirming' | 'done' | 'error'

function PaymentSuccessInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, setAdFree } = useAuthStore()

  const [status, setStatus]   = useState<Status>('confirming')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId    = searchParams.get('orderId')
    const amount     = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setStatus('error')
      setMessage('잘못된 접근입니다.')
      return
    }

    async function confirm() {
      try {
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        })
        const data = await res.json()

        if (!data.ok) {
          setStatus('error')
          setMessage(data.message ?? '결제 확인 실패')
          return
        }

        // Firestore에 adFree 저장
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), { adFree: true }).catch(() => {})
          setAdFree(true)
        }

        setStatus('done')
        setTimeout(() => router.replace('/trips'), 3000)
      } catch {
        setStatus('error')
        setMessage('네트워크 오류가 발생했습니다.')
      }
    }

    confirm()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] p-8 flex flex-col items-center gap-5 text-center">

        {status === 'confirming' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div>
              <p className="font-bold text-gray-900 text-lg">결제 확인 중...</p>
              <p className="text-sm text-gray-400 mt-1">잠시만 기다려 주세요</p>
            </div>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">광고 제거 완료!</p>
              <p className="text-sm text-gray-500 mt-1">
                이제 Voyalogue를 광고 없이 사용하실 수 있어요.
              </p>
              <p className="text-xs text-gray-400 mt-3">잠시 후 여행 목록으로 이동합니다...</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">결제 오류</p>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
            <button
              onClick={() => router.replace('/trips')}
              className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              여행 목록으로
            </button>
          </>
        )}

      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessInner />
    </Suspense>
  )
}
