'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Globe, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function AuthPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') ?? '/trips'
  const errorParam   = searchParams.get('error')
  const suspendedParam = searchParams.get('suspended')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      router.push(redirectTo)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoading(false)
        return
      }
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
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/20 text-white/90 rounded-full">BETA</span>
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

      {/* ── 오른쪽 패널 ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-5 sm:px-10 md:px-16 lg:px-24 bg-white min-h-screen lg:min-h-0 py-10 lg:py-0">
        <Link href="/" className="lg:hidden flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-8 self-start transition-colors">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Globe className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Voyalogue</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">BETA</span>
        </div>

        <motion.div
          className="max-w-[440px] w-full mx-auto flex flex-col gap-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              시작해볼까요?
            </h1>
            <p className="text-sm text-gray-500">
              Google 계정으로 간편하게 로그인 / 가입하세요.
            </p>
          </div>

          {errorParam === 'beta_full' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">베타 참여 인원이 마감되었습니다</p>
                <p className="text-xs text-amber-600 mt-0.5">정식 출시 후 다시 이용해주세요.</p>
              </div>
            </div>
          )}

          {suspendedParam === '1' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-red-500 text-lg flex-shrink-0">🚫</span>
              <div>
                <p className="text-sm font-semibold text-red-800">계정이 정지되었습니다</p>
                <p className="text-xs text-red-600 mt-0.5">자세한 내용은 관리자에게 문의해주세요.</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-4 border-2 border-gray-200 rounded-xl text-[15px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-3 disabled:opacity-60 shadow-sm"
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              : <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google 계정으로 계속하기
                </>
            }
          </button>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </motion.div>
      </div>
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
