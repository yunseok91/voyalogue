'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, ChevronRight } from 'lucide-react'

export const HINT_TOTAL = 4

const STEP_DEFS = [
  {
    step: 1,
    target: 'create-trip',
    title: '여행 만들기',
    description: '목적지와 날짜를 입력해 여행을 생성하세요.',
  },
  {
    step: 2,
    target: 'add-item',
    title: '일정 추가',
    description: '날짜별로 식사·장소·교통 일정을 기록하세요.',
  },
  {
    step: 3,
    target: 'member-btn',
    title: '멤버 초대',
    description: '링크를 공유해 친구·가족과 함께 계획하세요.',
  },
  {
    step: 4,
    target: 'menu-btn',
    title: '대시보드 & 별점',
    description: '메뉴에서 대시보드를 열면 별점·지출 요약을 확인할 수 있어요.',
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

  /* 대상 요소 하이라이트 */
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

  if (!def || vw === 0) return null

  const CALLOUT_W = 260
  const GAP = 12

  /* step 1은 target 없어도 하단 중앙에 표시, 2-4는 target 있는 페이지에서만 표시 */
  const isFallback = !rect
  if (isFallback && step !== 1) return null

  let posStyle: React.CSSProperties
  let arrowOnTop = false
  let arrowLeft = CALLOUT_W / 2 - 6

  if (isFallback) {
    posStyle = {
      bottom: 28,
      left: '50%',
      transform: 'translateX(-50%)',
    }
  } else {
    arrowOnTop = vh - rect!.bottom >= 160 || vh - rect!.bottom >= rect!.top
    const top = arrowOnTop ? rect!.bottom + GAP : rect!.top - 160 - GAP
    let left = rect!.left + rect!.width / 2 - CALLOUT_W / 2
    left = Math.max(8, Math.min(left, vw - CALLOUT_W - 8))
    arrowLeft = Math.max(10, Math.min(Math.round(rect!.left + rect!.width / 2 - left - 6), CALLOUT_W - 20))
    posStyle = { top, left }
  }

  return (
    <div
      className="fixed bg-white rounded-2xl p-4 border border-gray-100"
      style={{ ...posStyle, width: CALLOUT_W, zIndex: 9999, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
    >
      {!isFallback && arrowOnTop && (
        <div className="absolute w-3 h-3 bg-white rotate-45 border-l border-t border-gray-100" style={{ top: -6, left: arrowLeft }} />
      )}
      {!isFallback && !arrowOnTop && (
        <div className="absolute w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100" style={{ bottom: -6, left: arrowLeft }} />
      )}

      {/* 진행 도트 + 닫기 */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1">
          {Array.from({ length: HINT_TOTAL }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step - 1 ? 18 : 6,
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
          aria-label="닫기"
        >
          <X size={12} />
        </button>
      </div>

      <p className="text-[10px] font-semibold text-blue-500 mb-0.5">{step} / {HINT_TOTAL}</p>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{def.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{def.description}</p>

      <div className="flex items-center justify-between">
        <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
          닫기
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {step === HINT_TOTAL ? '완료' : '다음'}
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
