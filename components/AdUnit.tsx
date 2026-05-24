'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store'

declare global {
  interface Window {
    adsbygoogle: object[]
  }
}

type AdFormat = 'auto' | 'rectangle' | 'horizontal'

/* 모듈 레벨 Set: 컴포넌트 재마운트 시에도 중복 push 방지
   언마운트 시 삭제 → 페이지 이동 후 재방문 시 재초기화 허용 */
const _pushed = new Set<string>()

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
    if (_pushed.has(slot)) return

    const ins = document.querySelector(`ins[data-ad-slot="${slot}"]`) as HTMLElement | null
    if (!ins) return
    if (ins.getAttribute('data-adsbygoogle-status')) return

    _pushed.add(slot)
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch { /* ignore */ }

    return () => { _pushed.delete(slot) }
  }, [adFree, client, slot])

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