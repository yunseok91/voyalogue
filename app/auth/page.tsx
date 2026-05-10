'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Globe, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

type Mode = 'login' | 'signup'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/trips'
  const [mode,    setMode]   = useState<Mode>('login')
  const [email,   setEmail]  = useState('')
  const [password, setPw]    = useState('')
  const [name,    setName]   = useState('')
  const [showPw,  setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]  = useState('')

  const [showForgot,   setShowForgot]   = useState(false)
  const [forgotEmail,  setForgotEmail]  = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent,   setForgotSent]   = useState(false)
  const [forgotError,  setForgotError]  = useState('')

  const switchMode = (m: Mode) => { setMode(m); setError('') }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) { setForgotError('이메일을 입력해주세요.'); return }
    setForgotLoading(true)
    setForgotError('')
    try {
      await sendPasswordResetEmail(auth, forgotEmail)
      setForgotSent(true)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setForgotError(
        code === 'auth/user-not-found'  ? '등록되지 않은 이메일입니다.' :
        code === 'auth/invalid-email'   ? '올바른 이메일 형식이 아닙니다.' :
        '이메일 전송에 실패했습니다. 다시 시도해주세요.'
      )
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgot = () => {
    setShowForgot(false)
    setForgotEmail('')
    setForgotSent(false)
    setForgotError('')
  }

  /* ── 이메일/비밀번호 ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return }
    if (mode === 'signup' && !name) { setError('이름을 입력해주세요.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
      }
      router.push(redirectTo)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      const EXPECTED = new Set([
        'auth/invalid-credential','auth/user-not-found','auth/wrong-password',
        'auth/email-already-in-use','auth/invalid-email','auth/too-many-requests',
        'auth/network-request-failed','auth/operation-not-allowed',
      ])
      if (!EXPECTED.has(code)) console.error('[Auth Error]', code, err)
      setError(
        code === 'auth/invalid-credential'   ? '이메일 또는 비밀번호가 올바르지 않습니다.' :
        code === 'auth/user-not-found'       ? '등록되지 않은 이메일입니다.' :
        code === 'auth/wrong-password'       ? '비밀번호가 틀렸습니다.' :
        code === 'auth/email-already-in-use' ? '이미 사용 중인 이메일입니다.' :
        code === 'auth/invalid-email'        ? '올바른 이메일 형식이 아닙니다.' :
        code === 'auth/too-many-requests'    ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' :
        code === 'auth/network-request-failed' ? '네트워크 오류가 발생했습니다.' :
        code === 'auth/operation-not-allowed' ? '이메일/비밀번호 로그인이 비활성화되어 있습니다.' :
        `오류가 발생했습니다. (${code || 'unknown'})`
      )
    } finally {
      setLoading(false)
    }
  }

  /* ── Google 로그인 ── */
  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      router.push(redirectTo)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      const EXPECTED_GOOGLE = new Set([
        'auth/popup-closed-by-user','auth/popup-blocked',
        'auth/cancelled-popup-request','auth/unauthorized-domain','auth/operation-not-allowed',
      ])
      if (!EXPECTED_GOOGLE.has(code)) console.error('[Google Auth Error]', code, err)
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      setError(
        code === 'auth/popup-blocked'        ? '팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.' :
        code === 'auth/unauthorized-domain'  ? '현재 도메인이 Firebase에 허용되지 않았습니다.' :
        code === 'auth/operation-not-allowed' ? 'Google 로그인이 비활성화되어 있습니다.' :
        `Google 로그인 실패 (${code || 'unknown'})`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── 왼쪽 패널: 브랜드 ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #1e3a8a 100%)' }}
      >
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #60A5FA20 0%, transparent 70%)' }} />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Voyalogue
          </span>
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.2]"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            여행의 모든 순간을<br />완벽하게 계획하세요.
          </h2>
          <p className="text-[#93C5FD] text-lg leading-relaxed max-w-md">
            도시를 선택하고, 일정을 짜고,<br />친구들과 실시간으로 공유하세요.
          </p>
          <div className="flex flex-col gap-3 mt-2">
            {[
              '구글 맵 기반 장소 검색 & 동선 최적화',
              '실시간 환율 계산 & 예산 관리',
              '친구와 함께 편집하는 공유 일정',
            ].map(f => (
              <span key={f} className="flex items-center gap-2 text-[#BFDBFE] text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                {f}
              </span>
            ))}
          </div>
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2 text-[#93C5FD] hover:text-white text-sm transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
      </div>

      {/* ── 오른쪽 패널: 폼 ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-5 sm:px-10 md:px-16 lg:px-24 bg-white min-h-screen lg:min-h-0 py-10 lg:py-0">
        <Link href="/" className="lg:hidden flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-8 self-start transition-colors">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Globe className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
        </div>

        <motion.div
          className="max-w-[440px] w-full mx-auto flex flex-col gap-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mode === 'login' ? '다시 만나서 반가워요' : '새 계정 만들기'}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === 'login' ? '이메일로 로그인하고 여행을 이어가세요.' : '가입하고 첫 번째 여행 계획을 시작해보세요.'}
            </p>
          </div>

          {/* 탭 */}
          <div className="flex p-1 rounded-xl bg-gray-100">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-gray-700">이름</label>
                <input type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-[14px] py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-700">이메일</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-[14px] py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-gray-700">비밀번호</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    비밀번호 찾기
                  </button>
                )}
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="6자 이상 입력" value={password}
                  onChange={e => setPw(e.target.value)}
                  className="w-full px-[14px] py-3 pr-11 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[15px] font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : mode === 'login' ? '로그인하고 여행 시작  →' : '가입하기'
              }
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google 로그인 */}
          <button type="button" onClick={handleGoogle} disabled={loading}
            className="w-full py-3.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-60">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google 계정으로 계속하기
          </button>

          <p className="text-center text-sm text-gray-500">
            {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="text-blue-600 font-bold hover:underline">
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* 비밀번호 찾기 모달 */}
      {showForgot && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]"
          onClick={closeForgot}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-[360px] mx-4 shadow-xl"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              비밀번호 찾기
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </p>

            {forgotSent ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 text-center">이메일을 보냈습니다</p>
                <p className="text-xs text-gray-500 text-center">{forgotEmail}을 확인해주세요.</p>
                <button
                  onClick={closeForgot}
                  className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-[14px] py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  autoFocus
                />
                {forgotError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{forgotError}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={closeForgot}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center"
                  >
                    {forgotLoading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : '전송하기'
                    }
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  )
}
