'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function PaymentFailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const code    = searchParams.get('code') ?? ''
  const message = searchParams.get('message') ?? '결제가 취소되었습니다.'

  const isCancel = code === 'PAY_PROCESS_CANCELED' || code === 'USER_CANCEL'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] p-8 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
          {isCancel ? '👋' : '⚠️'}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">
            {isCancel ? '결제를 취소했어요' : '결제 실패'}
          </p>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={() => router.replace('/trips')}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            나중에
          </button>
          <button
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFailInner />
    </Suspense>
  )
}
