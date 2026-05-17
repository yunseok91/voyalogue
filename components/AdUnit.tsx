'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store'

declare global {
  interface Window {
    adsbygoogle: object[]
  }
}

type AdFormat = 'auto' | 'rectangle' | 'horizontal'

export function AdUnit({
  slot,
  format = 'auto',
  className = '',
}: {
  slot:       string
  format?:    AdFormat
  className?: string
}) {
  const adFree = useAuthStore(s => s.adFree)
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

  useEffect(() => {
    if (adFree) return
    if (!client || client === 'ca-pub-XXXXXXXXXXXXXXXX') return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch { /* ignore */ }
  }, [adFree, client])

  // 광고 제거 결제한 유저 or 아직 애드센스 미설정
  if (adFree) return null
  if (!client || client === 'ca-pub-XXXXXXXXXXXXXXXX') return null

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
