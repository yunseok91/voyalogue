'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, CheckSquare, Headset, LogOut,
  Users, Wallet, Crown, Edit2, Menu, X, Megaphone, UserCircle,
} from 'lucide-react'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { gradientStyle } from '@/lib/tripGradient'
import { InfoTooltip } from '@/components/InfoTooltip'

function getTimezone(city: string): string | null {
  const c = city.toLowerCase()
  if (/일본|japan|도쿄|tokyo|오사카|osaka|교토|kyoto|후쿠오카|fukuoka|나고야|nagoya|삿포로|sapporo/.test(c)) return 'Asia/Tokyo'
  if (/프랑스|france|파리|paris/.test(c)) return 'Europe/Paris'
  if (/영국|britain|uk |england|런던|london/.test(c)) return 'Europe/London'
  if (/뉴욕|new york/.test(c)) return 'America/New_York'
  if (/로스앤젤레스|los angeles|샌프란시스코|san francisco|라스베가스|las vegas/.test(c)) return 'America/Los_Angeles'
  if (/태국|thailand|방콕|bangkok|치앙마이|chiang mai/.test(c)) return 'Asia/Bangkok'
  if (/베트남|vietnam|하노이|hanoi|호치민|ho chi minh|다낭|da nang/.test(c)) return 'Asia/Ho_Chi_Minh'
  if (/싱가포르|singapore/.test(c)) return 'Asia/Singapore'
  if (/홍콩|hong kong/.test(c)) return 'Asia/Hong_Kong'
  if (/중국|china|베이징|beijing|상하이|shanghai/.test(c)) return 'Asia/Shanghai'
  if (/스페인|spain|마드리드|madrid|바르셀로나|barcelona/.test(c)) return 'Europe/Madrid'
  if (/이탈리아|italy|로마|rome|밀라노|milan|베네치아|venice|피렌체|florence/.test(c)) return 'Europe/Rome'
  if (/독일|germany|베를린|berlin|뮌헨|munich|프랑크푸르트|frankfurt/.test(c)) return 'Europe/Berlin'
  if (/호주|australia|시드니|sydney|멜버른|melbourne/.test(c)) return 'Australia/Sydney'
  if (/뉴질랜드|new zealand|오클랜드|auckland/.test(c)) return 'Pacific/Auckland'
  if (/터키|turkey|이스탄불|istanbul/.test(c)) return 'Europe/Istanbul'
  if (/아랍에미리트|uae|두바이|dubai/.test(c)) return 'Asia/Dubai'
  if (/인도|india|뭄바이|mumbai|델리|delhi/.test(c)) return 'Asia/Kolkata'
  if (/한국|korea|서울|seoul|부산|busan|제주|jeju/.test(c)) return 'Asia/Seoul'
  if (/필리핀|philippines|마닐라|manila|세부|cebu/.test(c)) return 'Asia/Manila'
  if (/발리|bali|인도네시아|indonesia|자카르타|jakarta/.test(c)) return 'Asia/Makassar'
  if (/말레이시아|malaysia|쿠알라룸푸르|kuala lumpur/.test(c)) return 'Asia/Kuala_Lumpur'
  if (/대만|taiwan|타이페이|taipei/.test(c)) return 'Asia/Taipei'
  if (/포르투갈|portugal|리스본|lisbon/.test(c)) return 'Europe/Lisbon'
  if (/네덜란드|netherlands|암스테르담|amsterdam/.test(c)) return 'Europe/Amsterdam'
  if (/체코|czech|프라하|prague/.test(c)) return 'Europe/Prague'
  if (/오스트리아|austria|빈|vienna/.test(c)) return 'Europe/Vienna'
  if (/스위스|switzerland|취리히|zurich|제네바|geneva/.test(c)) return 'Europe/Zurich'
  if (/그리스|greece|아테네|athens/.test(c)) return 'Europe/Athens'
  if (/터키|turkey|이스탄불|istanbul/.test(c)) return 'Europe/Istanbul'
  if (/캐나다|canada|토론토|toronto/.test(c)) return 'America/Toronto'
  if (/밴쿠버|vancouver/.test(c)) return 'America/Vancouver'
  if (/멕시코|mexico/.test(c)) return 'America/Mexico_City'
  if (/이집트|egypt|카이로|cairo/.test(c)) return 'Africa/Cairo'
  if (/모로코|morocco|마라케시|marrakech/.test(c)) return 'Africa/Casablanca'
  if (/러시아|russia|모스크바|moscow/.test(c)) return 'Europe/Moscow'
  return null
}

type ClockInfo = { time: string; dateFull: string; dateShort: string; offset: string }

function computeClock(tz: string): ClockInfo | null {
  try {
    const now = new Date()
    const time = new Intl.DateTimeFormat('ko', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(now)
    const datePart = new Intl.DateTimeFormat('ko', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' }).format(now)
    const weekPart = new Intl.DateTimeFormat('ko', { timeZone: tz, weekday: 'long' }).format(now)
    const shortDatePart = new Intl.DateTimeFormat('ko', { timeZone: tz, month: 'long', day: 'numeric' }).format(now)
    const dateFull  = `${datePart}, ${weekPart}`
    const dateShort = `${shortDatePart}, ${weekPart}`

    /* GMT 오프셋 계산 */
    const local = new Date(now.toLocaleString('en-US', { timeZone: tz }))
    const utc   = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    const diff  = Math.round((local.getTime() - utc.getTime()) / 60_000)
    const h = Math.floor(Math.abs(diff) / 60)
    const m = Math.abs(diff) % 60
    const sign = diff >= 0 ? '+' : '-'
    const offset = m > 0 ? `GMT${sign}${h}:${String(m).padStart(2, '0')}` : `GMT${sign}${h}`

    return { time, dateFull, dateShort, offset }
  } catch { return null }
}

function useLocalClock(timezone: string | null) {
  const [info, setInfo] = useState<ClockInfo | null>(() => timezone ? computeClock(timezone) : null)
  useEffect(() => {
    if (!timezone) return
    setInfo(computeClock(timezone))
    const id = setInterval(() => setInfo(computeClock(timezone)), 10_000)
    return () => clearInterval(id)
  }, [timezone])
  return info
}

export type NavMember = {
  id:          string
  name:        string
  photoURL?:   string
  role:        'owner' | 'treasurer' | 'member'
  colorIndex?: number
  hexColor?:   string
  left?:       boolean
}

type Props = {
  tripId:              string
  ownerId:             string
  city:                string
  title?:              string
  gradient:            string
  coverPhotoURL?:      string
  coverPhotoPosition?: number
  startDate:           string
  endDate:             string
  nights:              number

  isOwner:      boolean
  isTreasurer?: boolean
  user:         { uid: string; displayName?: string | null; photoURL?: string | null } | null

  members:       NavMember[]
  currentMember?: NavMember | null

  onMemberClick:     () => void
  onChecklistToggle: () => void
  onReportClick:     () => void
  onNoticeClick:     () => void
  onLeaveTrip?:      () => void
  onEditTrip?:       () => void
}

export function TripNavbar({
  city, title, gradient, coverPhotoURL, coverPhotoPosition,
  startDate, endDate, nights,
  isOwner, isTreasurer, user,
  members, currentMember,
  onMemberClick, onChecklistToggle, onReportClick, onNoticeClick,
  onLeaveTrip, onEditTrip,
}: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const timezone  = getTimezone(city)
  const localInfo = useLocalClock(timezone)

  const roleBadgeCls = isOwner
    ? 'bg-blue-600 text-white'
    : isTreasurer
    ? 'bg-amber-400 text-white'
    : 'bg-gray-100 text-gray-600'

  const swatchStyle = coverPhotoURL
    ? { backgroundImage: `url(${coverPhotoURL})`, backgroundSize: 'cover', backgroundPosition: `center ${coverPhotoPosition ?? 50}%` }
    : { background: gradientStyle(gradient) }

  const closeMenu = () => setShowMenu(false)

  return (
    <nav className="bg-white border-b border-gray-200 flex-shrink-0 z-20">

      {/* ── 줄 1 ── */}
      <div className="h-12 sm:h-14 flex items-center px-4 sm:px-6 gap-2">

        {/* 뒤로 */}
        <Link
          href="/trips"
          className="flex items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0 min-w-[28px] min-h-[36px] justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden lg:inline">내 여행</span>
        </Link>
        <div className="h-4 w-px bg-gray-200 hidden sm:block flex-shrink-0" />

        {/* 여행 정보 */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md flex-shrink-0 overflow-hidden" style={swatchStyle} />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 text-sm truncate leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {title || city}
            </span>
            {title && <span className="text-[11px] text-gray-400 leading-tight truncate">{city}</span>}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 hidden xl:block">
            {startDate.slice(5).replace('-', '/')} – {endDate.slice(5).replace('-', '/')} · {nights}박
          </span>
          {user && (
            <span className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${roleBadgeCls}`}>
              {isOwner
                ? <><Crown  className="w-2.5 h-2.5" />방장</>
                : isTreasurer
                ? <><Wallet className="w-2.5 h-2.5" />총무</>
                : <>게스트</>
              }
            </span>
          )}
          {onEditTrip && (
            <button
              onClick={onEditTrip}
              title="여행 정보 편집"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── 현지 시간 (데스크탑 2줄) ── */}
        {localInfo && (
          <div className="hidden sm:flex flex-col items-end flex-shrink-0 text-right pr-1">
            <span className="text-sm font-bold text-gray-800 tabular-nums leading-tight">{localInfo.time}</span>
            <span className="text-[10px] text-gray-400 leading-tight whitespace-nowrap">{localInfo.dateFull} ({localInfo.offset})</span>
          </div>
        )}

        {/* ── 데스크탑 액션 (sm 이상) ── */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">

          {/* 멤버 버튼 */}
          <button
            onClick={onMemberClick}
            data-tour="member-btn"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            title="멤버 목록"
          >
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m, i) => {
                const ci = m.hexColor ? undefined : (m.colorIndex ?? ((i % (CLAY.length - 1)) + 1))
                return (
                  <div key={m.id} className="relative" style={{ zIndex: 10 - i }}>
                    <PersonAvatar
                      name={m.name} photoURL={m.photoURL} size={26} stacked
                      colorIndex={ci}
                      hexColor={m.hexColor}
                      ringColor={m.photoURL ? (m.hexColor ?? CLAY[ci ?? 1]?.base) : undefined}
                    />
                    {m.role === 'owner'     && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500  rounded-full flex items-center justify-center"><Crown  className="w-1.5 h-1.5 text-white" /></span>}
                    {m.role === 'treasurer' && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center"><Wallet className="w-1.5 h-1.5 text-white" /></span>}
                  </div>
                )
              })}
              {members.length > 3 && (
                <div className="w-[26px] h-[26px] rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-gray-500">+{members.length - 3}</div>
              )}
            </div>
            <span className="hidden lg:inline text-xs font-semibold text-gray-600">{isOwner ? '멤버 편집' : '멤버'}</span>
            <Users className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {/* 탈퇴 */}
          {onLeaveTrip && user && currentMember && !currentMember.left && (
            <button
              onClick={onLeaveTrip}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 active:bg-red-100 transition-colors flex-shrink-0"
              title="여행 탈퇴"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* 메뉴 버튼 */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => setShowMenu(true)}
              data-tour="menu-btn"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 active:bg-blue-50 transition-colors"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden lg:inline text-xs font-semibold">메뉴</span>
            </button>
            <InfoTooltip text="준비물 체크리스트, 공지사항, 문의/신고, 마이페이지로 이동할 수 있습니다." width={210} />
          </div>
        </div>
      </div>

      {/* ── 줄 2 — 모바일 전용 (< sm) ── */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 border-t border-gray-100">
        {/* 멤버 버튼 */}
        <button
          onClick={onMemberClick}
          data-tour="member-btn"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-gray-200 active:bg-blue-50 transition-colors flex-shrink-0"
        >
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m, i) => {
              const ci = m.hexColor ? undefined : (m.colorIndex ?? ((i % (CLAY.length - 1)) + 1))
              return (
                <div key={m.id} className="relative" style={{ zIndex: 10 - i }}>
                  <PersonAvatar
                    name={m.name} photoURL={m.photoURL} size={24} stacked
                    colorIndex={ci}
                    hexColor={m.hexColor}
                    ringColor={m.photoURL ? (m.hexColor ?? CLAY[ci ?? 1]?.base) : undefined}
                  />
                </div>
              )
            })}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-gray-500">+{members.length - 3}</div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-600">{members.length}명</span>
        </button>

        {/* 현지 시간 (모바일 중앙) */}
        {localInfo ? (
          <div className="flex flex-col items-center text-center px-2">
            <span className="text-sm font-bold text-gray-800 tabular-nums leading-tight">{localInfo.time}</span>
            <span className="text-[10px] text-gray-400 leading-tight whitespace-nowrap">{localInfo.dateShort} ({localInfo.offset})</span>
          </div>
        ) : <div />}

        {/* 우측 아이콘 */}
        <div className="flex items-center gap-1.5">
          {onLeaveTrip && user && currentMember && !currentMember.left && (
            <button
              onClick={onLeaveTrip}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-red-200 text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
              title="여행 탈퇴"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowMenu(true)}
            data-tour="menu-btn"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 active:bg-blue-50 transition-colors"
            title="메뉴"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 드로어 메뉴 ── */}
      {showMenu && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeMenu} />
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-sm">메뉴</span>
              <button
                onClick={closeMenu}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col px-3 py-3">
              {/* 여행 준비물 */}
              <div className="flex items-center">
                <button
                  data-tour="checklist-btn"
                  onClick={() => { onChecklistToggle(); closeMenu() }}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-left flex-1 min-w-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">여행 준비물</p>
                    <p className="text-[11px] text-gray-400">여권·환전·예약 등 준비물 체크</p>
                  </div>
                </button>
                <InfoTooltip text="여행 전 챙겨야 할 물건·할 일을 체크리스트로 관리하세요. 멤버 전원이 함께 확인하고 완료 처리할 수 있어요." width={220} />
              </div>

              {/* 공지사항 */}
              <div className="flex items-center">
                <button
                  onClick={() => { onNoticeClick(); closeMenu() }}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-left flex-1 min-w-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Megaphone style={{ width: 18, height: 18 }} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">공지사항</p>
                    <p className="text-[11px] text-gray-400">{isOwner ? '멤버 전체에 공지 작성·수정' : '방장 공지 확인'}</p>
                  </div>
                </button>
                <InfoTooltip text={isOwner ? '멤버 전체에게 전달할 공지를 작성하세요. 집합 장소·주의사항·일정 변경 등을 공유할 수 있어요.' : '방장이 작성한 공지사항을 확인하세요.'} width={220} />
              </div>

              {/* 문의 / 버그 신고 */}
              <button
                onClick={() => { onReportClick(); closeMenu() }}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Headset style={{ width: 18, height: 18 }} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">문의 / 버그 신고</p>
                  <p className="text-[11px] text-gray-400">불편사항이나 오류를 알려주세요</p>
                </div>
              </button>

              {/* 마이페이지 */}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <UserCircle style={{ width: 18, height: 18 }} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">마이페이지</p>
                    <p className="text-[11px] text-gray-400">프로필 및 설정</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

    </nav>
  )
}
