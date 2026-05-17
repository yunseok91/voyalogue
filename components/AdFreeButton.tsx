'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments: (clientKey: string) => any
  }
}

export function AdFreeButton({ className = '' }: { className?: string }) {
  const { user, adFree } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (adFree) {
    return (
      <div className={`flex items-center gap-1.5 text-xs font-semibold text-emerald-600 ${className}`}>
        <Sparkles className="w-3.5 h-3.5" />
        광고 없는 버전 사용 중
      </div>
    )
  }

  const handleClick = async () => {
    if (!user) {
      router.push('/auth')
      return
    }

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!clientKey) return

    setLoading(true)
    try {
      const tossPayments = window.TossPayments(clientKey)
      await tossPayments.requestPayment('카드', {
        amount:        500,
        orderId:       `adFree_${user.uid}_${Date.now()}`,
        orderName:     'Voyalogue 광고 제거 (영구)',
        customerName:  user.displayName || user.email || '사용자',
        customerEmail: user.email || undefined,
        successUrl:    `${window.location.origin}/payment/success`,
        failUrl:       `${window.location.origin}/payment/fail`,
      })
    } catch (e: unknown) {
      // 사용자가 결제창 닫으면 여기로 옴 — 그냥 무시
      if ((e as { code?: string }).code !== 'USER_CANCEL') {
        console.error(e)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-90 transition-opacity disabled:opacity-60 ${className}`}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Sparkles className="w-3.5 h-3.5" />
      }
      광고 제거 <span className="opacity-80">500원</span>
    </button>
  )
}
