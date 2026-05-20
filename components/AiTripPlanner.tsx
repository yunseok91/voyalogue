'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, ChevronRight, ChevronLeft, Sparkles, Loader2,
  MapPin, Utensils, ShoppingBag, Car, MoreHorizontal, Calendar, Check, Search, Plus,
} from 'lucide-react'
import {
  collection, addDoc, setDoc, doc, serverTimestamp, getDoc, writeBatch, increment,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { generateCode } from '@/lib/inviteCode'
import { THEME_COLORS } from '@/lib/tripGradient'
import { loadGoogleMaps } from '@/lib/googleMaps'

/* ── 타입 ── */
type OptionItem = { label: string; value: string; emoji?: string }
type QuestionType = 'text' | 'select' | 'multiselect' | 'date_nights' | 'stepper'

/* ── 한국 주요 도시 ── */
const KR_CITIES = [
  '서울','부산','제주','인천','대구','대전','광주','경주','여수','강릉','속초','전주',
  '통영','거제','울산','춘천','가평','남해','포항','목포','순천','군산','담양','평창',
].map(city => ({ city, countryName: '한국', countryCode: 'kr', flagEmoji: '🇰🇷' }))

type CitySuggestion = { city: string; countryName: string; countryCode: string; flagEmoji: string }

/* ── 인기 해외 여행지 큐레이션 목록 ── */
const POPULAR_INTL: CitySuggestion[] = [
  // 일본
  { city: '도쿄',    countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '오사카',  countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '교토',    countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '후쿠오카', countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '삿포로',  countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '나고야',  countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '오키나와', countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '나라',    countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '히로시마', countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '고베',    countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  { city: '나하',    countryName: '일본', countryCode: 'jp', flagEmoji: '🇯🇵' },
  // 동남아
  { city: '발리',     countryName: '인도네시아', countryCode: 'id', flagEmoji: '🇮🇩' },
  { city: '자카르타', countryName: '인도네시아', countryCode: 'id', flagEmoji: '🇮🇩' },
  { city: '롬복',     countryName: '인도네시아', countryCode: 'id', flagEmoji: '🇮🇩' },
  { city: '방콕',     countryName: '태국', countryCode: 'th', flagEmoji: '🇹🇭' },
  { city: '치앙마이', countryName: '태국', countryCode: 'th', flagEmoji: '🇹🇭' },
  { city: '푸켓',     countryName: '태국', countryCode: 'th', flagEmoji: '🇹🇭' },
  { city: '파타야',   countryName: '태국', countryCode: 'th', flagEmoji: '🇹🇭' },
  { city: '코사무이', countryName: '태국', countryCode: 'th', flagEmoji: '🇹🇭' },
  { city: '싱가포르', countryName: '싱가포르', countryCode: 'sg', flagEmoji: '🇸🇬' },
  { city: '다낭',     countryName: '베트남', countryCode: 'vn', flagEmoji: '🇻🇳' },
  { city: '호치민',   countryName: '베트남', countryCode: 'vn', flagEmoji: '🇻🇳' },
  { city: '하노이',   countryName: '베트남', countryCode: 'vn', flagEmoji: '🇻🇳' },
  { city: '나트랑',   countryName: '베트남', countryCode: 'vn', flagEmoji: '🇻🇳' },
  { city: '호이안',   countryName: '베트남', countryCode: 'vn', flagEmoji: '🇻🇳' },
  { city: '세부',     countryName: '필리핀', countryCode: 'ph', flagEmoji: '🇵🇭' },
  { city: '마닐라',   countryName: '필리핀', countryCode: 'ph', flagEmoji: '🇵🇭' },
  { city: '보라카이', countryName: '필리핀', countryCode: 'ph', flagEmoji: '🇵🇭' },
  { city: '팔라완',   countryName: '필리핀', countryCode: 'ph', flagEmoji: '🇵🇭' },
  { city: '코타키나발루', countryName: '말레이시아', countryCode: 'my', flagEmoji: '🇲🇾' },
  { city: '쿠알라룸푸르', countryName: '말레이시아', countryCode: 'my', flagEmoji: '🇲🇾' },
  { city: '랑카위',   countryName: '말레이시아', countryCode: 'my', flagEmoji: '🇲🇾' },
  { city: '양곤',     countryName: '미얀마', countryCode: 'mm', flagEmoji: '🇲🇲' },
  // 중화권
  { city: '홍콩',   countryName: '홍콩', countryCode: 'hk', flagEmoji: '🇭🇰' },
  { city: '마카오', countryName: '마카오', countryCode: 'mo', flagEmoji: '🇲🇴' },
  { city: '타이베이', countryName: '대만', countryCode: 'tw', flagEmoji: '🇹🇼' },
  { city: '가오슝', countryName: '대만', countryCode: 'tw', flagEmoji: '🇹🇼' },
  { city: '상하이', countryName: '중국', countryCode: 'cn', flagEmoji: '🇨🇳' },
  { city: '베이징', countryName: '중국', countryCode: 'cn', flagEmoji: '🇨🇳' },
  // 유럽
  { city: '파리',       countryName: '프랑스',    countryCode: 'fr', flagEmoji: '🇫🇷' },
  { city: '런던',       countryName: '영국',      countryCode: 'gb', flagEmoji: '🇬🇧' },
  { city: '로마',       countryName: '이탈리아',  countryCode: 'it', flagEmoji: '🇮🇹' },
  { city: '밀라노',     countryName: '이탈리아',  countryCode: 'it', flagEmoji: '🇮🇹' },
  { city: '피렌체',     countryName: '이탈리아',  countryCode: 'it', flagEmoji: '🇮🇹' },
  { city: '베네치아',   countryName: '이탈리아',  countryCode: 'it', flagEmoji: '🇮🇹' },
  { city: '바르셀로나', countryName: '스페인',    countryCode: 'es', flagEmoji: '🇪🇸' },
  { city: '마드리드',   countryName: '스페인',    countryCode: 'es', flagEmoji: '🇪🇸' },
  { city: '암스테르담', countryName: '네덜란드',  countryCode: 'nl', flagEmoji: '🇳🇱' },
  { city: '베를린',     countryName: '독일',      countryCode: 'de', flagEmoji: '🇩🇪' },
  { city: '뮌헨',       countryName: '독일',      countryCode: 'de', flagEmoji: '🇩🇪' },
  { city: '빈',         countryName: '오스트리아', countryCode: 'at', flagEmoji: '🇦🇹' },
  { city: '프라하',     countryName: '체코',      countryCode: 'cz', flagEmoji: '🇨🇿' },
  { city: '부다페스트', countryName: '헝가리',    countryCode: 'hu', flagEmoji: '🇭🇺' },
  { city: '취리히',     countryName: '스위스',    countryCode: 'ch', flagEmoji: '🇨🇭' },
  { city: '리스본',     countryName: '포르투갈',  countryCode: 'pt', flagEmoji: '🇵🇹' },
  { city: '아테네',     countryName: '그리스',    countryCode: 'gr', flagEmoji: '🇬🇷' },
  { city: '산토리니',   countryName: '그리스',    countryCode: 'gr', flagEmoji: '🇬🇷' },
  { city: '이스탄불',   countryName: '튀르키예',  countryCode: 'tr', flagEmoji: '🇹🇷' },
  { city: '스톡홀름',   countryName: '스웨덴',    countryCode: 'se', flagEmoji: '🇸🇪' },
  { city: '코펜하겐',   countryName: '덴마크',    countryCode: 'dk', flagEmoji: '🇩🇰' },
  { city: '헬싱키',     countryName: '핀란드',    countryCode: 'fi', flagEmoji: '🇫🇮' },
  // 미주
  { city: '뉴욕',       countryName: '미국', countryCode: 'us', flagEmoji: '🇺🇸' },
  { city: 'LA',         countryName: '미국', countryCode: 'us', flagEmoji: '🇺🇸' },
  { city: '하와이',     countryName: '미국', countryCode: 'us', flagEmoji: '🇺🇸' },
  { city: '라스베이거스', countryName: '미국', countryCode: 'us', flagEmoji: '🇺🇸' },
  { city: '샌프란시스코', countryName: '미국', countryCode: 'us', flagEmoji: '🇺🇸' },
  { city: '시카고',     countryName: '미국', countryCode: 'us', flagEmoji: '🇺🇸' },
  { city: '밴쿠버',     countryName: '캐나다', countryCode: 'ca', flagEmoji: '🇨🇦' },
  { city: '토론토',     countryName: '캐나다', countryCode: 'ca', flagEmoji: '🇨🇦' },
  { city: '멕시코시티', countryName: '멕시코', countryCode: 'mx', flagEmoji: '🇲🇽' },
  // 오세아니아
  { city: '시드니',    countryName: '호주', countryCode: 'au', flagEmoji: '🇦🇺' },
  { city: '멜버른',    countryName: '호주', countryCode: 'au', flagEmoji: '🇦🇺' },
  { city: '골드코스트', countryName: '호주', countryCode: 'au', flagEmoji: '🇦🇺' },
  { city: '오클랜드',  countryName: '뉴질랜드', countryCode: 'nz', flagEmoji: '🇳🇿' },
  // 중동·기타
  { city: '두바이',   countryName: '아랍에미리트', countryCode: 'ae', flagEmoji: '🇦🇪' },
  { city: '아부다비', countryName: '아랍에미리트', countryCode: 'ae', flagEmoji: '🇦🇪' },
  { city: '몰디브',   countryName: '몰디브', countryCode: 'mv', flagEmoji: '🇲🇻' },
  { city: '모리셔스', countryName: '모리셔스', countryCode: 'mu', flagEmoji: '🇲🇺' },
]

/* ── 국가코드 → 국기 이모지 ── */
function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '🌍'
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

/* ── 목적지 검색 컴포넌트 ── */
function DestinationSearch({
  value, onChange, onConfirm,
}: {
  value: string
  onChange: (v: string) => void
  onConfirm: (label: string, confirmed: boolean) => void
}) {
  const [open,        setOpen]        = useState(false)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [loading,     setLoading]     = useState(false)
  const [confirmed,   setConfirmed]   = useState(false)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef   = useRef<AbortController | null>(null)

  /* 외부 클릭 닫기 */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleInput = useCallback((val: string) => {
    onChange(val)
    setConfirmed(false)
    setOpen(true)
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (val.length < 1) { setSuggestions([]); setLoading(false); return }

    const krMatches     = KR_CITIES.filter(c => c.city.includes(val))
    const popularMatches = POPULAR_INTL.filter(d => d.city.startsWith(val)).slice(0, 5)
    setSuggestions([...krMatches, ...popularMatches])

    if (val.length < 2) { setLoading(false); return }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        await loadGoogleMaps()
        if (ctrl.signal.aborted) return
        const svc = new google.maps.places.AutocompleteService()
        svc.getPlacePredictions({ input: val, types: ['(cities)'], language: 'ko' }, (preds, status) => {
          if (ctrl.signal.aborted) return
          setLoading(false)
          if (status !== google.maps.places.PlacesServiceStatus.OK || !preds) return
          const excludedNames = new Set([
            ...krMatches.map(c => c.city),
            ...popularMatches.map(d => d.city),
          ])
          const overseas: CitySuggestion[] = preds
            .slice(0, 6)
            .filter(p => {
              const city    = p.terms[0]?.value
              const country = p.terms[p.terms.length - 1]?.value ?? ''
              if (!city || country === '대한민국') return false
              if (excludedNames.has(city)) return false
              // 복합 도시명 제거 (예: "발리야구다" — 검색어의 2배 이상 긴 경우)
              if (city.startsWith(val) && city.length > val.length * 2) return false
              return true
            })
            .map(p => ({
              city:        p.terms[0]?.value ?? val,
              countryName: p.terms[p.terms.length - 1]?.value ?? '',
              countryCode: '',
              flagEmoji:   '🌍',
            }))
          setSuggestions([...krMatches, ...popularMatches, ...overseas])
        })
      } catch { setLoading(false) }
    }, 350)
  }, [onChange])

  const select = (label: string) => {
    onChange(label)
    setConfirmed(true)
    onConfirm(label, true)
    setOpen(false)
    setSuggestions([])
  }

  const showUnconfirmedHint = value.trim().length > 0 && !confirmed && !open

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
          : <Search  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        }
        <input
          type="text"
          placeholder="예: 도쿄, 파리, 방콕…"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => value.length > 0 && setOpen(true)}
          autoComplete="off"
          className={`w-full pl-10 pr-4 py-3.5 rounded-xl border text-gray-900 text-sm outline-none transition-all ${
            confirmed
              ? 'border-blue-500 ring-2 ring-blue-500/10'
              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
          }`}
        />
        {confirmed && (
          <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
        )}
      </div>

      {/* 경고: 직접 입력 (목록 미선택) */}
      {showUnconfirmedHint && (
        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
          <span>⚠️</span> 목록에서 선택하면 더 정확한 일정이 생성돼요
        </p>
      )}

      {/* 드롭다운 */}
      {open && value.trim().length > 0 && (
        <div className="absolute z-[300] top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {suggestions.length > 0 && (
            <ul className="max-h-52 overflow-y-auto py-1">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => select(s.countryName ? `${s.city}, ${s.countryName}` : s.city)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="text-lg leading-none flex-shrink-0">{s.flagEmoji}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1">{s.city}</span>
                    {s.countryName && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{s.countryName}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* 직접 추가 */}
          <div className={suggestions.length > 0 ? 'border-t border-gray-100' : ''}>
            <button
              type="button"
              onMouseDown={() => select(value.trim())}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
            >
              <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-blue-600 font-semibold">"{value.trim()}" 직접 입력</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export type AiQuestion = {
  id:       string
  label:    string
  sub?:     string
  type:     QuestionType
  enabled:  boolean
  order:    number
  required: boolean
  options?: OptionItem[]
  min?:     number
  max?:     number
}

/* ── 기본 질문 정의 (Firestore override 가능) ── */
export const DEFAULT_QUESTIONS: AiQuestion[] = [
  {
    id: 'destination', label: '어디로 떠나나요?', sub: '도시 또는 나라를 입력하세요',
    type: 'text', enabled: true, order: 1, required: true,
  },
  {
    id: 'date_nights', label: '언제, 며칠 동안 가나요?', sub: '출발일·귀국일 선택 후 항공편 시간대도 알려주세요',
    type: 'date_nights', enabled: true, order: 2, required: true,
  },
  {
    id: 'companion', label: '누구랑 가나요?',
    type: 'select', enabled: true, order: 3, required: true,
    options: [
      { label: '혼자',   value: '혼자'   },
      { label: '커플',   value: '커플'   },
      { label: '친구들', value: '친구들' },
      { label: '가족',   value: '가족'   },
    ],
  },
  {
    id: 'budget', label: '인당 현지 경비는?', sub: '항공·숙박 제외 · 건너뛰어도 돼요',
    type: 'select', enabled: true, order: 4, required: false,
    options: [
      { label: '💸 ~50만원',      value: '25'  },
      { label: '💵 50~100만원',   value: '75'  },
      { label: '💴 100~200만원',  value: '150' },
      { label: '💎 200만원 이상', value: '300' },
    ],
  },
  {
    id: 'vibe', label: '여행 바이브는?', sub: '스타일·관심사를 한 번에',
    type: 'select', enabled: true, order: 5, required: true,
    options: [
      { label: '🍜 먹방 중심',       value: '먹방중심' },
      { label: '🏯 핫플 + 관광',     value: '핫플관광' },
      { label: '😌 느긋한 힐링',     value: '느긋하게' },
      { label: '💎 럭셔리·프리미엄', value: '프리미엄' },
    ],
  },
  {
    id: 'pace', label: '하루 일정 강도는?',
    type: 'select', enabled: true, order: 6, required: true,
    options: [
      { label: '🏃 빽빽하게', value: '빽빽하게' },
      { label: '🚶 적당히',   value: '적당히'   },
      { label: '🛋 느긋하게', value: '느긋하게' },
    ],
  },
  {
    id: 'foodPref', label: '음식 취향을 골라주세요', sub: '복수 선택 가능 · 건너뛰어도 돼요',
    type: 'multiselect', enabled: true, order: 7, required: false,
    options: [
      { label: '현지 로컬 맛집',    value: '현지로컬'   },
      { label: '인스타 감성 카페',  value: '인스타카페' },
      { label: '가성비 식당',       value: '가성비식당' },
      { label: '미슐랭·파인다이닝', value: '파인다이닝' },
    ],
  },
  {
    id: 'transport', label: '현지 이동 수단은?',
    type: 'select', enabled: true, order: 8, required: true,
    options: [
      { label: '🚇 대중교통',  value: '대중교통' },
      { label: '🚗 렌터카',    value: '렌터카'   },
      { label: '🤷 아직 모름', value: '미정'     },
    ],
  },
  {
    id: 'accommodation', label: '숙소는 어떻게 할까요?',
    type: 'select', enabled: true, order: 9, required: true,
    options: [
      { label: '이미 예약했어요', value: 'booked'    },
      { label: '추천해 주세요',   value: 'recommend' },
    ],
  },
]

type Answers = Record<string, string | string[]>

type GeneratedPlan = {
  tripTitle: string
  days: {
    dayId: string
    items: {
      name:     string
      timeSlot: '아침' | '점심' | '저녁' | '미정'
      cat:      '식사' | '장소' | '쇼핑' | '교통' | '기타'
      price:    number
      currency: string
      comment:  string
      lat:      number
      lng:      number
    }[]
  }[]
}

/* ── 헬퍼 ── */
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function calcNights(start: string, end: string): number {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

function fmtDate(dateStr: string) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

const CAT_ICON: Record<string, React.ReactNode> = {
  '식사': <Utensils className="w-3.5 h-3.5" />,
  '장소': <MapPin   className="w-3.5 h-3.5" />,
  '쇼핑': <ShoppingBag className="w-3.5 h-3.5" />,
  '교통': <Car      className="w-3.5 h-3.5" />,
  '기타': <MoreHorizontal className="w-3.5 h-3.5" />,
}

const SLOT_COLOR: Record<string, string> = {
  '아침': 'bg-amber-100 text-amber-700',
  '점심': 'bg-blue-100 text-blue-700',
  '저녁': 'bg-purple-100 text-purple-700',
  '미정': 'bg-gray-100 text-gray-500',
}

function peopleFromCompanion(companion: string, people?: string): number {
  if (companion === '혼자') return 1
  if (companion === '커플') return 2
  return Math.max(2, parseInt(people ?? '3') || 3)
}

/* ── 메인 컴포넌트 ── */
interface Props {
  onClose: () => void
}

const DAILY_LIMIT = 10

export function AiTripPlanner({ onClose }: Props) {
  const router       = useRouter()
  const { user }     = useAuthStore()

  const [questions,   setQuestions]   = useState<AiQuestion[]>(DEFAULT_QUESTIONS)
  const [stepIdx,     setStepIdx]     = useState(0)
  const [answers,     setAnswers]     = useState<Answers>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startDate = tomorrow.toISOString().slice(0, 10)
    const endDate   = addDays(startDate, 3)
    return { startDate, endDate, nights: '3', people: '3' }
  })
  const [phase,       setPhase]       = useState<'checking' | 'quiz' | 'generating' | 'preview' | 'creating'>('checking')
  const [plan,        setPlan]        = useState<GeneratedPlan | null>(null)
  const [previewDay,  setPreviewDay]  = useState(0)
  const [error,          setError]          = useState('')
  const [dailyUsed,      setDailyUsed]      = useState(false)
  const [remainingCount, setRemainingCount] = useState(DAILY_LIMIT)
  const inputRef = useRef<HTMLInputElement>(null)

  /* 질문 설정 + 하루 제한 확인 */
  useEffect(() => {
    const checkLimit = async () => {
      if (!user) { setPhase('quiz'); return }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const today      = new Date().toISOString().slice(0, 10)
          const usageDate  = snap.data().aiUsageDate as string | undefined
          const usageCount = (snap.data().aiUsageCount as number) ?? 0
          if (usageDate === today) {
            const remaining = Math.max(0, DAILY_LIMIT - usageCount)
            setRemainingCount(remaining)
            if (remaining === 0) setDailyUsed(true)
          }
        }
      } catch { /* 실패해도 허용 */ }
      setPhase('quiz')
    }

    const loadQuestions = () => {
      getDoc(doc(db, 'config', 'aiPlannerQuestions')).then(snap => {
        if (!snap.exists()) return
        const data = snap.data()
        if (Array.isArray(data.questions)) {
          const overrides: Record<string, Partial<AiQuestion>> = {}
          for (const q of data.questions) overrides[q.id] = q
          setQuestions(DEFAULT_QUESTIONS.map(q => ({ ...q, ...overrides[q.id] })))
        }
      }).catch(() => {})
    }

    checkLimit()
    loadQuestions()
  }, [user])

  const activeQuestions = questions
    .filter(q => q.enabled)
    .sort((a, b) => a.order - b.order)

  const current = activeQuestions[stepIdx]
  const isLast  = stepIdx === activeQuestions.length - 1

  /* 자동 포커스 */
  useEffect(() => {
    if (current?.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [stepIdx, current])

  /* ── 답변 핸들러 ── */
  function setAnswer(id: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function toggleMulti(id: string, value: string) {
    const prev = (answers[id] as string[]) ?? []
    setAnswer(id, prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  /* ── 다음 단계 ── */
  function handleNext() {
    if (!canNext()) return
    if (isLast) {
      generatePlan()
    } else {
      setStepIdx(i => i + 1)
    }
  }

  function canNext(): boolean {
    if (!current) return false
    const ans = answers[current.id]
    if (!current.required) return true
    if (current.type === 'multiselect') return true
    if (current.type === 'stepper') return true
    if (current.type === 'date_nights') {
      return !!(answers['startDate'] && answers['endDate'] && Number(answers['nights']) > 0)
    }
    return !!ans && (typeof ans === 'string' ? ans.trim() !== '' : ans.length > 0)
  }

  /* ── AI 생성 ── */
  async function generatePlan() {
    if (dailyUsed) return
    setPhase('generating')
    setError('')
    try {
      const res = await fetch('/api/ai-trip-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination:           answers['destination'],
          startDate:             answers['startDate'],
          nights:                Number(answers['nights']),
          companion:             answers['companion']             ?? '커플',
          people:                answers['people']               ?? '3',
          vibe:                  answers['vibe']                  ?? '핫플관광',
          pace:                  answers['pace']                  ?? '적당히',
          foodPref:              answers['foodPref']              ?? [],
          accommodation:         answers['accommodation']         ?? 'recommend',
          accommodationStyle:    answers['accommodationStyle']    ?? '',
          accommodationLocation: answers['accommodationLocation'] ?? '',
          transport:             answers['transport']             ?? '미정',
          arrivalTime:           answers['arrivalTime']           ?? '',
          departureTime:         answers['departureTime']         ?? '',
          budget:                answers['budget']                ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? '생성 실패')

      /* 성공 시 사용 횟수 기록 */
      if (user) {
        const today = new Date().toISOString().slice(0, 10)
        setDoc(doc(db, 'users', user.uid), {
          aiUsageDate:  today,
          aiUsageCount: increment(1),
        }, { merge: true }).catch(() => {})
        setRemainingCount(prev => {
          const next = Math.max(0, prev - 1)
          if (next === 0) setDailyUsed(true)
          return next
        })
      }

      setPlan(data)
      setPhase('preview')
      setPreviewDay(0)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg || 'AI 오류가 발생했습니다. 다시 시도해주세요.')
      setPhase('quiz')
    }
  }

  /* ── 여행 저장 ── */
  async function handleCreate() {
    if (!plan || !user) return
    setPhase('creating')
    try {
      const nights   = Number(answers['nights'])
      const start    = answers['startDate'] as string
      const end      = addDays(start, nights)
      const gradient = `${THEME_COLORS[3].from},${THEME_COLORS[3].to}`
      const viewCode = generateCode()
      const editCode = generateCode()
      const people   = peopleFromCompanion(answers['companion'] as string ?? '커플', answers['people'] as string)
      const budget = Math.max(0, parseInt((answers['budget'] as string) || '0') || 0) * 10000

      const tripRef = await addDoc(collection(db, 'users', user.uid, 'trips'), {
        city:       answers['destination'],
        country:    '',
        startDate:  start,
        endDate:    end,
        nights,
        days:       nights + 1,
        gradient,
        people,
        budget,
        title:      `[AI 추천] ${plan.tripTitle}`,
        viewCode,
        editCode,
        aiGenerated: true,
        members:    [{ id: user.uid, name: user.displayName ?? '나', role: 'owner', ...(user.photoURL ? { photoURL: user.photoURL } : {}) }],
        createdAt:  serverTimestamp(),
        updatedAt:  serverTimestamp(),
      })

      await Promise.all([
        setDoc(doc(db, 'shareIndex', viewCode), { uid: user.uid, tripId: tripRef.id, canEdit: false }),
        setDoc(doc(db, 'shareIndex', editCode), { uid: user.uid, tripId: tripRef.id, canEdit: true  }),
      ])

      /* 배치로 items 저장 */
      const batch = writeBatch(db)
      for (const day of plan.days) {
        for (const [i, item] of day.items.entries()) {
          const itemRef = doc(
            collection(db, 'users', user.uid, 'trips', tripRef.id, 'days', day.dayId, 'items')
          )
          batch.set(itemRef, {
            name:           item.name,
            timeSlot:       item.timeSlot,
            cat:            item.cat,
            price:          item.price   ?? 0,
            currency:       item.currency ?? 'KRW',
            comment:        item.comment ?? '',
            lat:            item.lat     ?? 0,
            lng:            item.lng     ?? 0,
            rating:         0,
            ratings:        {},
            participants:   people,
            participantIds: [],
            receipts:       [],
            order:          i,
          })
        }
      }
      await batch.commit()

      router.push(`/trips/${tripRef.id}`)
    } catch (e) {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
      setPhase('preview')
    }
  }

  /* ── 렌더링 ── */
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:w-[520px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[96dvh] sm:max-h-[90dvh] min-h-[520px]">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI 여행 플래너</p>
              {phase === 'quiz' && !dailyUsed && (
                <p className="text-[11px] text-gray-400">
                  {stepIdx + 1} / {activeQuestions.length}
                  <span className="ml-2 text-blue-500">오늘 {remainingCount}회 남음</span>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 진행 바 */}
        {phase === 'quiz' && (
          <div className="px-5 pb-3 flex-shrink-0">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full transition-all duration-300"
                style={{ width: `${((stepIdx + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 본문 — destination 단계만 dropdown을 위해 overflow-visible, 나머지 스크롤 가능 */}
        <div className={`flex-1 px-5 pb-4 overflow-x-hidden ${
          phase === 'quiz' && current?.id === 'destination'
            ? 'overflow-y-visible'
            : 'overflow-y-auto'
        }`}>

            {/* ── 로딩 확인 중 ── */}
          {phase === 'checking' && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          )}

          {/* ── 하루 제한 안내 ── */}
          {phase === 'quiz' && dailyUsed && (
            <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl">
                ⏰
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">오늘 AI 생성 횟수를 모두 사용했어요</p>
                <p className="text-sm text-gray-400 mt-1.5">
                  무료 플랜은 하루 {DAILY_LIMIT}회까지 생성할 수 있어요.
                </p>
                <p className="text-sm font-semibold text-blue-600 mt-1">
                  내일 자정에 초기화돼요
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold"
              >
                직접 일정 만들기
              </button>
            </div>
          )}

          {/* ── 퀴즈 단계 ── */}
          {phase === 'quiz' && !dailyUsed && current && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {current.label}
                </h2>
                {current.sub && <p className="text-sm text-gray-400 mt-1">{current.sub}</p>}
              </div>

              {/* 목적지 검색 (destination 질문) */}
              {current.type === 'text' && current.id === 'destination' && (
                <DestinationSearch
                  value={(answers['destination'] as string) ?? ''}
                  onChange={v => setAnswer('destination', v)}
                  onConfirm={(label) => setAnswer('destination', label)}
                />
              )}

              {/* 예산 숫자 입력 */}
              {current.type === 'text' && current.id === 'budget' && (() => {
                const raw = (answers['budget'] as string) ?? ''
                const krw = (parseInt(raw) || 0) * 10000
                const PRESETS = [30, 50, 100, 150, 200, 300, 500]
                return (
                  <div className="flex flex-col gap-4">
                    {/* 입력창 */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          ref={inputRef}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          value={raw}
                          onChange={e => {
                            const v = e.target.value.replace(/[^0-9]/g, '')
                            setAnswer('budget', v)
                          }}
                          onKeyDown={e => e.key === 'Enter' && handleNext()}
                          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-xl font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-right pr-16"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">만원</span>
                      </div>
                    </div>
                    {/* 환산 표시 */}
                    <p className="text-sm font-semibold text-center text-blue-600">
                      {krw > 0
                        ? `= ${krw.toLocaleString()}원`
                        : <span className="text-gray-400">예산 미설정 시 0원으로 저장돼요</span>
                      }
                    </p>
                    {/* 빠른 선택 */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-400">빠른 선택</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESETS.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setAnswer('budget', String(p))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              raw === String(p)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            {p}만원
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* 일반 텍스트 입력 (기타 text 타입) */}
              {current.type === 'text' && current.id !== 'destination' && current.id !== 'budget' && (
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="입력하세요"
                  value={(answers[current.id] as string) ?? ''}
                  onChange={e => setAnswer(current.id, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              )}

              {/* 스테퍼 (인원 수 등) */}
              {current.type === 'stepper' && (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt((answers[current.id] as string) ?? '2')
                        const min = current.min ?? 1
                        if (cur > min) setAnswer(current.id, String(cur - 1))
                      }}
                      className="w-14 h-14 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-30"
                      disabled={parseInt((answers[current.id] as string) ?? '2') <= (current.min ?? 1)}
                    >
                      −
                    </button>
                    <div className="flex flex-col items-center min-w-[80px]">
                      <span className="text-5xl font-extrabold text-gray-900 tabular-nums leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {answers[current.id] ?? '2'}
                      </span>
                      <span className="text-sm text-gray-400 mt-1.5 font-medium">명</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt((answers[current.id] as string) ?? '2')
                        const max = current.max ?? 20
                        if (cur < max) setAnswer(current.id, String(cur + 1))
                      }}
                      className="w-14 h-14 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-30"
                      disabled={parseInt((answers[current.id] as string) ?? '2') >= (current.max ?? 20)}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-center max-w-[320px]">
                    {Array.from({ length: (current.max ?? 20) - (current.min ?? 1) + 1 }, (_, i) => i + (current.min ?? 1)).map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(current.id, String(n))}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                          parseInt((answers[current.id] as string) ?? '2') === n
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 날짜 범위 선택 */}
              {current.type === 'date_nights' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3">
                    {/* 출발일 */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">출발일</label>
                      <div className="relative min-w-0">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="date"
                          value={(answers['startDate'] as string) ?? ''}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={e => {
                            const start = e.target.value
                            setAnswer('startDate', start)
                            const end = answers['endDate'] as string
                            if (end && start >= end) {
                              const newEnd = addDays(start, 1)
                              setAnswer('endDate', newEnd)
                              setAnswer('nights', '1')
                            } else if (end) {
                              setAnswer('nights', String(calcNights(start, end)))
                            }
                          }}
                          className="w-full max-w-full min-w-0 pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none"
                        />
                      </div>
                    </div>
                    {/* 귀가일 */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">귀가일</label>
                      <div className="relative min-w-0">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="date"
                          value={(answers['endDate'] as string) ?? ''}
                          min={addDays((answers['startDate'] as string) || new Date().toISOString().slice(0, 10), 1)}
                          onChange={e => {
                            const end = e.target.value
                            setAnswer('endDate', end)
                            setAnswer('nights', String(calcNights(answers['startDate'] as string, end)))
                          }}
                          className="w-full max-w-full min-w-0 pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 자동 계산 결과 */}
                  {answers['startDate'] && answers['endDate'] && Number(answers['nights']) > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex-1">
                        <p className="text-xs text-blue-500 font-semibold mb-0.5">여행 기간</p>
                        <p className="text-sm font-bold text-blue-800">
                          {fmtDate(answers['startDate'] as string)} ~ {fmtDate(answers['endDate'] as string)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 bg-blue-600 text-white rounded-xl px-3 py-1.5 text-center">
                        <p className="text-lg font-extrabold leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {answers['nights']}박
                        </p>
                        <p className="text-[10px] font-semibold opacity-80 mt-0.5">
                          {Number(answers['nights']) + 1}일
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 항공편 시간대 */}
                  <div className="flex flex-col gap-2.5">
                    <p className="text-xs font-semibold text-gray-500">항공편 시간대 (선택)</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-gray-400">첫날 도착 시간대</label>
                        <div className="flex gap-1.5">
                          {['오전', '오후', '저녁', '심야'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setAnswer('arrivalTime', answers['arrivalTime'] === t ? '' : t)}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                answers['arrivalTime'] === t
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-gray-400">마지막날 출발 시간대</label>
                        <div className="flex gap-1.5">
                          {['오전', '오후', '저녁', '심야'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setAnswer('departureTime', answers['departureTime'] === t ? '' : t)}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                answers['departureTime'] === t
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 단일 선택 */}
              {current.type === 'select' && current.options && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {current.options.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswer(current.id, opt.value)}
                        className={`flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border-2 text-sm font-semibold text-left transition-all ${
                          answers[current.id] === opt.value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* 친구들/가족 — 인원 스테퍼 */}
                  {current.id === 'companion' && (answers['companion'] === '친구들' || answers['companion'] === '가족') && (
                    <div className="flex flex-col gap-2 px-1">
                      <label className="text-xs font-semibold text-gray-500">
                        {answers['companion'] === '가족' ? '가족' : '친구'} 인원 (본인 포함)
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseInt((answers['people'] as string) ?? '3')
                            if (cur > 2) setAnswer('people', String(cur - 1))
                          }}
                          disabled={parseInt((answers['people'] as string) ?? '3') <= 2}
                          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all disabled:opacity-30"
                        >−</button>
                        <span className="text-3xl font-extrabold text-gray-900 min-w-[48px] text-center" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {answers['people'] ?? '3'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseInt((answers['people'] as string) ?? '3')
                            if (cur < 20) setAnswer('people', String(cur + 1))
                          }}
                          disabled={parseInt((answers['people'] as string) ?? '3') >= 20}
                          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all disabled:opacity-30"
                        >+</button>
                        <span className="text-sm text-gray-500 font-semibold">명</span>
                      </div>
                    </div>
                  )}

                  {/* 숙소 위치 입력 (예약된 경우) */}
                  {current.id === 'accommodation' && answers['accommodation'] === 'booked' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">숙소 위치 (선택)</label>
                      <input
                        type="text"
                        placeholder="예: 신주쿠역 근처, 명동, 오사카 난바…"
                        value={(answers['accommodationLocation'] as string) ?? ''}
                        onChange={e => setAnswer('accommodationLocation', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                      <p className="text-[11px] text-gray-400">입력하시면 숙소 주변으로 동선을 최적화해 드려요</p>
                    </div>
                  )}

                  {/* 숙소 스타일 선택 (추천받는 경우) */}
                  {current.id === 'accommodation' && answers['accommodation'] === 'recommend' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-500">원하는 숙소 스타일</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: '🛏️ 가성비 (잠만 자면 됨)', value: '가성비'  },
                          { label: '🏨 깔끔한 3~4성급',         value: '3~4성급' },
                          { label: '💎 럭셔리 호캉스',           value: '럭셔리'  },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAnswer('accommodationStyle', opt.value)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                              answers['accommodationStyle'] === opt.value
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 복수 선택 */}
              {current.type === 'multiselect' && current.options && (
                <div className="grid grid-cols-2 gap-2.5">
                  {current.options.map(opt => {
                    const selected = ((answers[current.id] as string[]) ?? []).includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleMulti(current.id, opt.value)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 text-sm font-semibold text-left transition-all ${
                          selected
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {opt.label}
                        {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            </div>
          )}

          {/* ── 생성 중 ── */}
          {phase === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-9 h-9 text-white animate-pulse" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border-2 border-blue-300/40 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">AI가 일정을 만들고 있어요</p>
                <p className="text-sm text-gray-400 mt-1">
                  {answers['destination']} {answers['nights']}박 {Number(answers['nights']) + 1}일 여행 중…
                </p>
              </div>
              <div className="flex gap-1.5">
                {['from-blue-400 to-blue-500', 'from-violet-400 to-violet-500', 'from-blue-400 to-blue-500'].map((g, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${g} animate-bounce`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── 미리보기 ── */}
          {phase === 'preview' && plan && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {plan.tripTitle}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {answers['destination']} · {answers['nights']}박 {Number(answers['nights']) + 1}일
                </p>
              </div>

              {/* 날짜 탭 */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                {plan.days.map((day, i) => (
                  <button
                    key={day.dayId}
                    onClick={() => setPreviewDay(i)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      previewDay === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Day {i + 1}
                  </button>
                ))}
              </div>

              {/* 아이템 목록 */}
              {plan.days[previewDay] && (
                <div className="flex flex-col gap-2.5">
                  {plan.days[previewDay].items.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-3.5 flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500">
                        {CAT_ICON[item.cat] ?? <MoreHorizontal className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-gray-900 truncate">{item.name}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${SLOT_COLOR[item.timeSlot]}`}>
                            {item.timeSlot}
                          </span>
                        </div>
                        {item.price > 0 && (
                          <p className="text-xs text-blue-600 font-semibold mb-1">
                            {item.price.toLocaleString()} {item.currency}
                          </p>
                        )}
                        {item.comment && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              {/* 금액/카테고리 수정 안내 */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-base leading-none flex-shrink-0 mt-0.5">💡</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <b>금액은 AI 추정치예요.</b> 일정 저장 후 각 장소를 탭해서 실제 금액과 카테고리를 직접 수정할 수 있어요.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setPlan(null); setPhase('quiz'); setStepIdx(activeQuestions.length - 1) }}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  다시 생성
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  이 일정으로 시작
                </button>
              </div>
            </div>
          )}

          {/* ── 저장 중 ── */}
          {phase === 'creating' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-base font-bold text-gray-900">여행을 만들고 있어요…</p>
            </div>
          )}

        </div>

        {/* 하단 버튼 (퀴즈 단계 + 제한 없을 때만) */}
        {phase === 'quiz' && !dailyUsed && (
          <div className="px-5 pb-5 pt-3 flex gap-2.5 flex-shrink-0 border-t border-gray-100">
            <button
              onClick={() => stepIdx > 0 ? setStepIdx(i => i - 1) : onClose()}
              className="w-11 h-11 flex items-center justify-center rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex-1 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isLast ? (
                <><Sparkles className="w-4 h-4" /> AI 일정 생성하기</>
              ) : (
                <>다음 <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
