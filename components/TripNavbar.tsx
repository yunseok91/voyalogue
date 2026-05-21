'use client'

import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CheckSquare, Headset, LogOut,
  Users, Wallet, Crown, Edit2,
} from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { PersonAvatar, CLAY } from '@/components/PersonAvatar'
import { gradientStyle } from '@/lib/tripGradient'

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

  /* 탈퇴 제외, photoURL 오버라이드 완료 */
  members:       NavMember[]
  currentMember?: NavMember | null

  summaryHref: string

  onMemberClick:     () => void
  onChecklistToggle: () => void
  onReportClick:     () => void
  onLeaveTrip?:      () => void
  onEditTrip?:       () => void
}

export function TripNavbar({
  city, title, gradient, coverPhotoURL, coverPhotoPosition,
  startDate, endDate, nights,
  isOwner, isTreasurer, user,
  members, currentMember,
  summaryHref,
  onMemberClick, onChecklistToggle, onReportClick,
  onLeaveTrip, onEditTrip,
}: Props) {
  const roleBadgeCls = isOwner
    ? 'bg-blue-600 text-white'
    : isTreasurer
    ? 'bg-amber-400 text-white'
    : 'bg-gray-100 text-gray-600'

  const swatchStyle = coverPhotoURL
    ? { backgroundImage: `url(${coverPhotoURL})`, backgroundSize: 'cover', backgroundPosition: `center ${coverPhotoPosition ?? 50}%` }
    : { background: gradientStyle(gradient) }

  const showSummary = !!(user && (isOwner || currentMember))

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

        {/* 여행 정보 — flex-1 로 남은 공간 차지 */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md flex-shrink-0 overflow-hidden" style={swatchStyle} />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 text-sm truncate leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {title || city}
            </span>
            {title && <span className="text-[11px] text-gray-400 leading-tight truncate">{city}</span>}
          </div>
          {/* 날짜 — xl 이상에서만 표시 */}
          <span className="text-xs text-gray-400 flex-shrink-0 hidden xl:block">
            {startDate.slice(5).replace('-', '/')} – {endDate.slice(5).replace('-', '/')} · {nights}박
          </span>
          {/* 역할 뱃지 */}
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
          {/* 편집 버튼 (방장 전용) */}
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

        {/* ── 데스크톱 액션 (sm 이상) ── */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">

          {/* 멤버 버튼: sm~lg 아이콘, lg+ 텍스트 포함 */}
          <button
            onClick={onMemberClick}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            title="멤버 목록"
          >
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m, i) => (
                <div key={m.id} className="relative" style={{ zIndex: 10 - i }}>
                  <PersonAvatar
                    name={m.name} photoURL={m.photoURL} size={26} stacked
                    colorIndex={m.hexColor ? undefined : (m.colorIndex ?? ((i % (CLAY.length - 1)) + 1))}
                    hexColor={m.hexColor}
                  />
                  {m.role === 'owner'     && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500  rounded-full flex items-center justify-center"><Crown  className="w-1.5 h-1.5 text-white" /></span>}
                  {m.role === 'treasurer' && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center"><Wallet className="w-1.5 h-1.5 text-white" /></span>}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-[26px] h-[26px] rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-gray-500">+{members.length - 3}</div>
              )}
            </div>
            <span className="hidden lg:inline text-xs font-semibold text-gray-600">{isOwner ? '멤버 편집' : '멤버'}</span>
            <Users className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {/* 알림 */}
          {user && <NotificationBell />}

          {/* 문의/버그 신고 */}
          <button
            onClick={onReportClick}
            title="문의 / 버그 신고"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500 active:bg-orange-50 transition-colors flex-shrink-0"
          >
            <Headset className="w-4 h-4" />
          </button>

          {/* 체크리스트: sm~lg 아이콘, lg+ 텍스트 포함 */}
          <button
            onClick={onChecklistToggle}
            title="체크리스트"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 active:bg-blue-50 transition-colors flex-shrink-0"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden lg:inline text-xs font-semibold">체크리스트</span>
          </button>

          {/* 여행 요약 */}
          {showSummary && (
            <Link
              href={summaryHref}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 active:bg-gray-700 transition-colors flex-shrink-0"
            >
              <span className="hidden lg:inline text-xs font-semibold">여행 </span>
              <span className="text-xs font-semibold">요약</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* 탈퇴 (share 비방장) */}
          {onLeaveTrip && user && currentMember && !currentMember.left && (
            <button
              onClick={onLeaveTrip}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 active:bg-red-100 transition-colors flex-shrink-0"
              title="여행 탈퇴"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 줄 2 — 모바일 전용 (< sm) ── */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 border-t border-gray-100">
        {/* 멤버 버튼 */}
        <button
          onClick={onMemberClick}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-gray-200 active:bg-blue-50 transition-colors"
        >
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m, i) => (
              <div key={m.id} className="relative" style={{ zIndex: 10 - i }}>
                <PersonAvatar
                  name={m.name} photoURL={m.photoURL} size={24} stacked
                  colorIndex={m.hexColor ? undefined : (m.colorIndex ?? ((i % (CLAY.length - 1)) + 1))}
                  hexColor={m.hexColor}
                />
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-gray-500">+{members.length - 3}</div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-600">{members.length}명</span>
        </button>

        {/* 우측 아이콘 */}
        <div className="flex items-center gap-1.5">
          {user && <NotificationBell />}
          <button
            onClick={onReportClick}
            title="문의 / 버그 신고"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500 active:bg-orange-50 transition-colors flex-shrink-0"
          >
            <Headset className="w-4 h-4" />
          </button>
          <button
            onClick={onChecklistToggle}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 active:bg-blue-50 transition-colors"
            title="체크리스트"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          {showSummary && (
            <Link
              href={summaryHref}
              className="h-9 px-3.5 flex items-center gap-1 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 active:bg-gray-700 transition-colors"
            >
              요약<ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {onLeaveTrip && user && currentMember && !currentMember.left && (
            <button
              onClick={onLeaveTrip}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-red-200 text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
              title="여행 탈퇴"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </nav>
  )
}
