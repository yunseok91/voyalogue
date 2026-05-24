'use client'

import { useEffect, useRef } from 'react'
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
  const adFree  = useAuthStore(s => s.adFree)
  const client  = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const pushed  = useRef(false)

  useEffect(() => {
    if (adFree) return
    if (!client || client === 'ca-pub-XXXXXXXXXXXXXXXX') return
    if (pushed.current) return
    /* 이미 광고가 삽입된 ins 요소면 중복 push 방지 */
    const ins = document.querySelector(`ins[data-ad-slot="${slot}"]`) as HTMLElement | null
    if (ins?.getAttribute('data-adsbygoogle-status')) return
    pushed.current = true
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch { /* ignore */ }
  }, [adFree, client, slot])

  // 광고 제거 결제한 유저 or 아직 애드센스 미설정 or 플레이스홀더 슬롯
  if (adFree) return null
  if (!client || client === 'ca-pub-XXXXXXXXXXXXXXXX') return null
  if (!slot || slot.toUpperCase().includes('REPLACE_WITH') || slot === 'XXXXXXXXXX') return null

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
