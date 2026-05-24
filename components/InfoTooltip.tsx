'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'

interface Props {
  text: string
  width?: number
}

export function InfoTooltip({ text, width = 210 }: Props) {
  const [open,    setOpen]    = useState(false)
  const [style,   setStyle]   = useState<React.CSSProperties>({})
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  /* 클라이언트 마운트 확인 (SSR 안전) */
  useEffect(() => { setMounted(true) }, [])

  const calc = useCallback(() => {
    if (!btnRef.current) return
    const r  = btnRef.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const goDown = r.top < 200
    setStyle({
      position: 'fixed',
      zIndex:   99999,
      width,
      left: Math.max(8, Math.min(cx - width / 2, window.innerWidth - width - 8)),
      ...(goDown
        ? { top: r.bottom + 8 }
        : { top: r.top - 8, transform: 'translateY(-100%)' }),
    })
  }, [width])

  /* 외부 클릭 닫기 */
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onClick={() => { calc(); setOpen(v => !v) }}
        className="flex items-center justify-center text-gray-300 hover:text-blue-400 transition-colors focus:outline-none"
        aria-label="도움말"
      >
        <HelpCircle size={14} />
      </button>

      {mounted && open && createPortal(
        <div style={style}>
          <div style={{
            background:   '#111827',
            color:        '#fff',
            fontSize:     11,
            lineHeight:   1.6,
            borderRadius: 10,
            padding:      '8px 12px',
            boxShadow:    '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {text}
          </div>
        </div>,
        document.body,
      )}
    </span>
  )
}
