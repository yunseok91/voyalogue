'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Copy, Check } from 'lucide-react'

function detect() {
  if (typeof navigator === 'undefined') return { isInApp: false, isIOS: false, app: '' }
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  if (/KAKAOTALK/i.test(ua))   return { isInApp: true, isIOS, app: '카카오톡' }
  if (/Instagram/i.test(ua))   return { isInApp: true, isIOS, app: '인스타그램' }
  if (/FBAV|FBAN/i.test(ua))   return { isInApp: true, isIOS, app: '페이스북' }
  if (/Line\//i.test(ua))      return { isInApp: true, isIOS, app: 'LINE' }
  if (/NaverApp/i.test(ua))    return { isInApp: true, isIOS, app: '네이버' }
  if (/DaumBrowser/i.test(ua)) return { isInApp: true, isIOS, app: '다음' }
  return { isInApp: false, isIOS, app: '' }
}

export function InAppBrowserGate({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<{ isInApp: boolean; isIOS: boolean; app: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setInfo(detect())
    setUrl(window.location.href)
  }, [])

  /* 감지 전 */
  if (!info) return <>{children}</>

  /* 일반 브라우저 */
  if (!info.isInApp) return <>{children}</>

  /* 인앱 브라우저 감지 */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback: select text */
    }
  }

  /* Android: Chrome intent로 바로 열기 시도 */
  const handleOpenExternal = () => {
    if (!info.isIOS) {
      const intent = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
      window.location.href = intent
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 text-center"
      style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* 로고 */}
      <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-5 shadow-lg">
        <ExternalLink className="w-6 h-6 text-white" />
      </div>

      <h1 className="text-xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        외부 브라우저에서 열어주세요
      </h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        {info.app} 내 브라우저에서는 로그인이<br />정상적으로 작동하지 않아요.
      </p>

      {/* 안내 카드 */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        {info.isIOS ? (
          /* iOS 안내 */
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">iPhone 사용자</p>
            <div className="flex flex-col gap-3 text-left">
              {[
                { step: '1', text: `화면 하단 또는 우측 상단의 '···' 메뉴를 탭해요` },
                { step: '2', text: `'Safari로 열기' 또는 '기본 브라우저로 열기'를 선택해요` },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <p className="text-sm text-gray-700 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Android 안내 */
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Android 사용자</p>
            <button
              onClick={handleOpenExternal}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <ExternalLink className="w-4 h-4" />
              Chrome으로 열기
            </button>
            <p className="text-xs text-gray-400 text-center">안 되면 아래 주소를 복사해서 Chrome에서 열어주세요</p>
          </div>
        )}
      </div>

      {/* URL 복사 */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3">
          <p className="flex-1 text-xs text-gray-500 truncate text-left">{url}</p>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-300 mt-8">Voyalogue</p>
    </div>
  )
}
