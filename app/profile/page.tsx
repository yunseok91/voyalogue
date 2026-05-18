'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
} from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, storage } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'
import { CLAY } from '@/components/PersonAvatar'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNavbar } from '@/components/AppNavbar'
import { PersonAvatar } from '@/components/PersonAvatar'
import {
  User, Key, LogOut, Check, ChevronRight,
  Plane, Moon, MapPin, Trash2, Download,
  Shield, HelpCircle, FileText, Globe, Camera, Loader2,
} from 'lucide-react'

/* ── 통화 옵션 ── */
const CURRENCIES = [
  { code: 'KRW', label: '₩ 한국 원 (KRW)' },
  { code: 'USD', label: '$ 미국 달러 (USD)' },
  { code: 'JPY', label: '¥ 일본 엔 (JPY)' },
  { code: 'EUR', label: '€ 유로 (EUR)' },
  { code: 'GBP', label: '£ 영국 파운드 (GBP)' },
  { code: 'CNY', label: '¥ 중국 위안 (CNY)' },
  { code: 'THB', label: '฿ 태국 바트 (THB)' },
  { code: 'SGD', label: 'S$ 싱가포르 달러 (SGD)' },
]

/* ── 섹션 래퍼 ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      <div className="px-5 sm:px-6 py-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}

/* ── 정보 행 ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right truncate">{value}</span>
    </div>
  )
}

/* ── 링크 행 ── */
function LinkRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-1 text-sm text-gray-700 hover:text-gray-900 transition-colors group"
    >
      <span className="flex items-center gap-2.5">
        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</span>
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
    </button>
  )
}

type Stats = { total: number; nights: number; cities: number }

function ProfileContent() {
  const { user, setUser, avatarColor, setAvatarColor, avatarHexColor, setAvatarHexColor } = useAuthStore()
  const router            = useRouter()

  const displayName  = user?.displayName || user?.email?.split('@')[0] || 'Y'
  const isGoogleUser = user?.providerData?.[0]?.providerId === 'google.com'

  const selectedRingColor = avatarHexColor ?? (CLAY[avatarColor ?? 0]?.base ?? CLAY[0].base)

  /* ── 아바타 색상 ── */
  const [colorSaving, setColorSaving] = useState(false)
  const hexInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user || avatarColor !== null) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (typeof data.avatarColor === 'number') setAvatarColor(data.avatarColor)
        if (typeof data.avatarHexColor === 'string') setAvatarHexColor(data.avatarHexColor)
      }
    })
  }, [user?.uid])

  const handleColorChange = async (idx: number) => {
    if (!user) return
    setAvatarColor(idx)
    setAvatarHexColor(null)
    setColorSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid), { avatarColor: idx, avatarHexColor: null }, { merge: true })
    } finally {
      setColorSaving(false)
    }
  }

  const handleHexColorChange = async (hex: string) => {
    if (!user) return
    setAvatarHexColor(hex)
    setAvatarColor(null)
    setColorSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid), { avatarHexColor: hex, avatarColor: null }, { merge: true })
    } finally {
      setColorSaving(false)
    }
  }

  /* ── 프로필 사진 업로드 ── */
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError,   setPhotoError]   = useState('')
  const [localPhoto,   setLocalPhoto]   = useState<string | null>(null)
  const currentPhoto = localPhoto ?? user?.photoURL ?? null

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { setPhotoError('5MB 이하 파일만 업로드 가능합니다.'); return }
    setPhotoLoading(true); setPhotoError('')
    try {
      const sRef = storageRef(storage, `users/${user.uid}/avatar`)
      await uploadBytes(sRef, file)
      const url = await getDownloadURL(sRef)
      await updateProfile(user, { photoURL: url })
      await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true })
      setLocalPhoto(url)
      if (auth.currentUser) setUser(auth.currentUser)
    } catch { setPhotoError('사진 업로드에 실패했습니다.') }
    finally   { setPhotoLoading(false) }
  }
  const joinDate     = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  /* ── 여행 통계 (본인 + 초대받은 여행 합산) ── */
  const [stats, setStats]     = useState<Stats | null>(null)
  useEffect(() => {
    if (!user) return
    Promise.all([
      getDocs(collection(db, 'users', user.uid, 'trips')),
      getDocs(collection(db, 'users', user.uid, 'invitedTrips')),
    ]).then(([ownSnap, invSnap]) => {
      const own = ownSnap.docs.map(d => d.data())
      const nights = own.reduce((s, t) => s + (t.nights ?? 0), 0)
      const cities = new Set(own.map(t => (t.city as string).split(',')[0].trim())).size
      setStats({ total: own.length + invSnap.size, nights, cities })
    })
  }, [user])

  /* ── 이름 변경 ── */
  const [name,        setName]        = useState(user?.displayName || '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSaved,   setNameSaved]   = useState(false)
  const [nameError,   setNameError]   = useState('')

  const handleSaveName = async () => {
    if (!user || !name.trim()) return
    setNameLoading(true); setNameError('')
    try {
      await updateProfile(user, { displayName: name.trim() })
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2500)
    } catch { setNameError('이름 저장에 실패했습니다.') }
    finally   { setNameLoading(false) }
  }

  /* ── 비밀번호 재설정 ── */
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSent,    setPwSent]    = useState(false)
  const [pwError,   setPwError]   = useState('')

  const handleSendResetEmail = async () => {
    if (!user?.email) return
    setPwLoading(true); setPwError('')
    try {
      await sendPasswordResetEmail(auth, user.email)
      setPwSent(true)
    } catch { setPwError('이메일 전송에 실패했습니다.') }
    finally   { setPwLoading(false) }
  }

  /* ── 기본 통화 ── */
  const [currency, setCurrency] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('voyalogue_currency') ?? 'KRW') : 'KRW'
  )
  const handleCurrency = (v: string) => {
    setCurrency(v)
    localStorage.setItem('voyalogue_currency', v)
  }

  /* ── 로그아웃 ── */
  const [showLogout, setShowLogout] = useState(false)
  const handleLogout = async () => {
    await signOut(auth)
    router.push('/auth')
  }

  /* ── 계정 탈퇴 ── */
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError,   setDeleteError]   = useState('')

  const handleDeleteAccount = async () => {
    if (!user || deleteInput !== '탈퇴') return
    setDeleteLoading(true); setDeleteError('')
    try {
      await deleteUser(user)
      router.push('/')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setDeleteError(
        code === 'auth/requires-recent-login'
          ? '보안을 위해 재로그인 후 탈퇴해주세요.'
          : '탈퇴 처리 중 오류가 발생했습니다.'
      )
    } finally { setDeleteLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AppNavbar active="profile" />

      <main className="max-w-[640px] mx-auto px-4 pt-8 sm:pt-12 pb-20">

        {/* ── 프로필 헤더 ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-4">
          <div className="flex items-center gap-4 mb-5">
            {/* 아바타 + 업로드 오버레이 */}
            <div className="relative flex-shrink-0 group/av">
              <PersonAvatar
                name={displayName}
                photoURL={currentPhoto ?? undefined}
                size={80}
                colorIndex={avatarHexColor ? undefined : (avatarColor ?? 0)}
                hexColor={avatarHexColor ?? undefined}
                ringColor={currentPhoto ? selectedRingColor : undefined}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 hover:bg-black/35 transition-colors"
                title="프로필 사진 변경"
              >
                {photoLoading
                  ? <Loader2 className="w-5 h-5 text-white animate-spin opacity-0 group-hover/av:opacity-100" />
                  : <Camera className="w-5 h-5 text-white opacity-0 group-hover/av:opacity-100 transition-opacity" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-extrabold text-gray-900 truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {displayName}
              </p>
              <p className="text-sm text-gray-500 truncate mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {isGoogleUser && (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google 연결
                  </span>
                )}
                {joinDate && (
                  <span className="text-[11px] text-gray-400">{joinDate} 가입</span>
                )}
              </div>
            </div>
          </div>

          {/* 사진 업로드 에러 */}
          {photoError && (
            <p className="text-xs text-red-500 mb-3 -mt-2">{photoError}</p>
          )}

          {/* 아이콘 색상 선택 */}
          <div className="mb-5">
            <span className="text-xs font-medium text-gray-400 block mb-2">{currentPhoto ? '테두리 색상' : '아이콘 색상'}</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onClick={() => handleColorChange(i)}
                  style={{ background: CLAY[i].base }}
                  className={`w-7 h-7 rounded-full transition-all duration-150 flex-shrink-0 ${
                    !avatarHexColor && (avatarColor ?? 0) === i
                      ? 'ring-2 ring-offset-2 ring-gray-500 scale-110'
                      : 'hover:scale-110 opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
              <div className="w-px h-5 bg-gray-200" />
              {/* 커스텀 컬러 피커 */}
              <button
                onClick={() => hexInputRef.current?.click()}
                title="커스텀 색상 선택"
                style={avatarHexColor
                  ? { background: avatarHexColor }
                  : { background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }
                }
                className={`w-7 h-7 rounded-full transition-all duration-150 flex-shrink-0 ${
                  avatarHexColor
                    ? 'ring-2 ring-offset-2 ring-gray-500 scale-110'
                    : 'hover:scale-110 opacity-70 hover:opacity-100'
                }`}
              />
              <input
                ref={hexInputRef}
                type="color"
                className="sr-only"
                value={avatarHexColor ?? '#4A90E8'}
                onChange={e => handleHexColorChange(e.target.value)}
              />
              {colorSaving && <span className="text-xs text-gray-400 ml-1">저장 중…</span>}
            </div>
          </div>

          {/* 여행 통계 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Plane className="w-4 h-4" />, value: stats?.total ?? '–', label: '총 여행' },
              { icon: <Moon className="w-4 h-4" />,  value: stats?.nights ?? '–', label: '총 박수' },
              { icon: <MapPin className="w-4 h-4" />, value: stats?.cities ?? '–', label: '방문 도시' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl py-3 px-2 flex flex-col items-center gap-1">
                <span className="text-blue-500">{s.icon}</span>
                <p className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
                <p className="text-[11px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 계정 설정 ── */}
        <Section title="계정 설정">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">이름</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameSaved(false) }}
                placeholder="이름 입력"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
              <button
                onClick={handleSaveName}
                disabled={nameLoading || !name.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {nameSaved ? <><Check className="w-4 h-4" /> 저장됨</> : nameLoading ? '저장 중…' : '저장'}
              </button>
            </div>
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">이메일</label>
            <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 select-all">
              {user?.email}
            </div>
          </div>
        </Section>

        {/* ── 보안 ── */}
        <Section title="보안">
          {isGoogleUser ? (
            <InfoRow label="로그인 방식" value="Google 계정으로 로그인 중" />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">비밀번호 변경</p>
                  <p className="text-xs text-gray-400 mt-0.5">이메일로 재설정 링크를 보내드립니다.</p>
                </div>
                {pwSent ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full flex-shrink-0">
                    <Check className="w-3.5 h-3.5" /> 전송됨
                  </span>
                ) : (
                  <button
                    onClick={handleSendResetEmail}
                    disabled={pwLoading}
                    className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50 flex-shrink-0"
                  >
                    {pwLoading ? '전송 중…' : '이메일 전송'}
                  </button>
                )}
              </div>
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
            </>
          )}
          <InfoRow label="최근 로그인" value={
            user?.metadata?.lastSignInTime
              ? new Date(user.metadata.lastSignInTime).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
              : ''
          } />
        </Section>

        {/* ── 앱 설정 ── */}
        <Section title="앱 설정">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">기본 통화</p>
              <p className="text-xs text-gray-400 mt-0.5">예산 계산에 사용됩니다.</p>
            </div>
            <select
              value={currency}
              onChange={e => handleCurrency(e.target.value)}
              className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </Section>

        {/* ── 데이터 관리 ── */}
        <Section title="데이터 관리">
          <LinkRow
            icon={<Download className="w-4 h-4" />}
            label="여행 데이터 내보내기 (Excel)"
            onClick={() => router.push('/trips')}
          />
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-500">계정 탈퇴</p>
                <p className="text-xs text-gray-400 mt-0.5">모든 데이터가 영구 삭제됩니다.</p>
              </div>
              <button
                onClick={() => setShowDelete(true)}
                className="text-xs font-semibold text-red-400 hover:text-red-600 flex-shrink-0 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> 탈퇴하기
              </button>
            </div>
          </div>
        </Section>

        {/* ── 고객 지원 ── */}
        <Section title="고객 지원">
          <LinkRow icon={<HelpCircle className="w-4 h-4" />} label="도움말 및 피드백"    onClick={() => router.push('/contact')} />
          <LinkRow icon={<FileText className="w-4 h-4" />}   label="이용약관"            onClick={() => router.push('/terms')} />
          <LinkRow icon={<Shield className="w-4 h-4" />}     label="개인정보처리방침"    onClick={() => router.push('/privacy')} />
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2.5 text-sm text-gray-400">
              <Globe className="w-4 h-4" />
              Voyalogue v1.0.0
            </span>
            <span className="text-xs text-gray-300">BETA</span>
          </div>
        </Section>

        {/* ── 로그아웃 ── */}
        <button
          onClick={() => setShowLogout(true)}
          className="w-full py-3.5 border border-red-200 hover:bg-red-50 text-red-500 text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </main>

      {/* ── 로그아웃 확인 모달 ── */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowLogout(false)}>
          <div className="bg-white rounded-2xl p-6 w-[320px] mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">로그아웃</h3>
            <p className="text-sm text-gray-500 mb-5">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogout(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                아니오
              </button>
              <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 계정 탈퇴 확인 모달 ── */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError('') }}>
          <div className="bg-white rounded-2xl p-6 w-[360px] mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">정말 탈퇴하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-4">
              모든 여행 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              계속하려면 아래에 <strong>탈퇴</strong>를 입력해주세요.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="탈퇴"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 mb-3 transition-all"
            />
            {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError('') }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== '탈퇴' || deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center"
              >
                {deleteLoading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : '탈퇴 확인'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  return <AuthGuard><ProfileContent /></AuthGuard>
}
