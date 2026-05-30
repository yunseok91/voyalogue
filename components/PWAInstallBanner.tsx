'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Share, Plus } from 'lucide-react'

const DISMISSED_KEY = 'pwa_banner_dismissed'
const DELAY_MS = 3000

type Mode = 'android' | 'ios' | null

function detectMode(): Mode {
  if (typeof window === 'undefined') return null
  // 이미 설치됨
  if (window.matchMedia('(display-mode: standalone)').matches) return null
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)
  if (isIos) return 'ios'
  // Android Chrome — beforeinstallprompt 이벤트가 있으면 android로 처리
  return 'android'
}

export function PWAInstallBanner() {
  const [visible,  setVisible]  = useState(false)
  const [mode,     setMode]     = useState<Mode>(null)
  const [iosGuide, setIosGuide] = useState(false)
  const deferredRef = useRef<Event & { prompt?: () => Promise<void> } | null>(null)

  useEffect(() => {
    try { if (localStorage.getItem(DISMISSED_KEY)) return } catch {}

    const m = detectMode()
    if (!m) return

    if (m === 'android') {
      const handler = (e: Event) => {
        e.preventDefault()
        deferredRef.current = e as Event & { prompt?: () => Promise<void> }
        setMode('android')
        setTimeout(() => setVisible(true), DELAY_MS)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }

    if (m === 'ios') {
      setMode('ios')
      setTimeout(() => setVisible(true), DELAY_MS)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
  }

  const handleInstall = async () => {
    if (mode === 'android' && deferredRef.current?.prompt) {
      await deferredRef.current.prompt()
      dismiss()
    } else if (mode === 'ios') {
      setIosGuide(true)
    }
  }

  if (!visible) return null

  return (
    <>
      {/* iOS 안내 모달 */}
      {iosGuide && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-[2px] pb-6 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <div className="px-5 pt-5 pb-4">
              <p className="text-sm font-bold text-gray-900 mb-4">홈 화면에 추가하는 법</p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: <Share className="w-5 h-5 text-blue-500" />, text: '하단 공유 버튼을 탭하세요' },
                  { icon: <Plus className="w-5 h-5 text-blue-500" />, text: '"홈 화면에 추가"를 선택하세요' },
                  { icon: <span className="text-lg">✅</span>, text: '추가 버튼을 누르면 완료!' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {s.icon}
                    </div>
                    <p className="text-sm text-gray-700">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => { setIosGuide(false); dismiss() }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 배너 */}
      <div className="fixed bottom-0 inset-x-0 z-[100] flex justify-center pb-safe">
        <div
          className="w-full max-w-lg mx-3 mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 animate-slide-up"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-extrabold text-lg">
            V
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">앱으로 설치하기</p>
            <p className="text-xs text-gray-400">홈 화면에 추가하면 더 빠르게 열려요</p>
          </div>
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex-shrink-0"
          >
            {mode === 'ios' ? '방법 보기' : '설치'}
          </button>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
