'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, ChevronRight } from 'lucide-react'

export const CALLOUT_TOTAL = 4

const STEP_DEFS = [
  {
    step: 1,
    target: 'create-trip',
    title: '새 여행 만들기',
    description: 'AI가 여행 일정 초안을 추천해드려요. 목적지·날짜를 입력하고 대표 사진과 예산도 설정할 수 있어요.',
  },
  {
    step: 2,
    target: 'member-btn',
    title: '멤버 초대 & 역할',
    description: 'PIN 번호로 친구를 초대하세요. 방장·총무·멤버 역할을 설정해 함께 여행을 관리할 수 있어요.',
  },
  {
    step: 3,
    target: 'checklist-btn',
    title: '여행 체크리스트',
    description: '준비물과 할 일을 체크리스트로 관리하세요. 멤버 모두가 실시간으로 확인하고 완료 체크할 수 있어요.',
  },
  {
    step: 4,
    target: 'summary-btn',
    title: '여행 요약 & 예산',
    description: '여행 예산 설정, 지출 내역 기록, 멤버 간 정산까지 한눈에 확인하세요.',
  },
]

interface Props {
  step: number
  onNext: () => void
  onSkip: () => void
}

function findVisible(target: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)).find(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }) ?? null
  )
}

export function OnboardingCallout({ step, onNext, onSkip }: Props) {
  const def = STEP_DEFS.find(s => s.step === step)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)

  const measure = useCallback(() => {
    if (!def) return
    const el = findVisible(def.target)
    setRect(el ? el.getBoundingClientRect() : null)
    setVw(window.innerWidth)
    setVh(window.innerHeight)
  }, [def])

  /* Highlight target element */
  useEffect(() => {
    if (!def) return
    const el = findVisible(def.target)
    if (!el) return
    const prev = { outline: el.style.outline, outlineOffset: el.style.outlineOffset, borderRadius: el.style.borderRadius }
    el.style.outline = '2.5px solid #3b82f6'
    el.style.outlineOffset = '3px'
    el.style.borderRadius = '8px'
    return () => {
      el.style.outline = prev.outline
      el.style.outlineOffset = prev.outlineOffset
      el.style.borderRadius = prev.borderRadius
    }
  }, [def])

  useEffect(() => {
    measure()
    const t = setTimeout(measure, 200)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [measure])

  if (!def || !rect || vw === 0) return null

  const CALLOUT_W = 272
  const GAP = 12

  const arrowOnTop = vh - rect.bottom >= 170 || vh - rect.bottom >= rect.top

  const top = arrowOnTop ? rect.bottom + GAP : rect.top - 178 - GAP
  let left = rect.left + rect.width / 2 - CALLOUT_W / 2
  left = Math.max(8, Math.min(left, vw - CALLOUT_W - 8))
  const arrowLeft = Math.max(10, Math.min(Math.round(rect.left + rect.width / 2 - left - 7), CALLOUT_W - 24))

  return (
    <div
      className="fixed bg-white rounded-2xl p-4 border border-gray-100"
      style={{
        top, left, width: CALLOUT_W,
        zIndex: 9999,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}
    >
      {arrowOnTop && (
        <div
          className="absolute w-3 h-3 bg-white rotate-45 border-l border-t border-gray-100"
          style={{ top: -6, left: arrowLeft }}
        />
      )}
      {!arrowOnTop && (
        <div
          className="absolute w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100"
          style={{ bottom: -6, left: arrowLeft }}
        />
      )}

      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1">
          {Array.from({ length: CALLOUT_TOTAL }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step - 1 ? 20 : 6,
                height: 6,
                borderRadius: 9999,
                background: i === step - 1 ? '#3b82f6' : '#e5e7eb',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
        <button
          onClick={onSkip}
          className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      <h3 className="text-sm font-bold text-gray-900 mb-1">{def.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{def.description}</p>

      <div className="flex items-center justify-between">
        <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
          건너뛰기
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {step === CALLOUT_TOTAL ? '완료' : '다음'}
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
