'use client'

import { useEffect } from 'react'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    /* 배포 후 구버전 JS 청크 로딩으로 인한 오류 → 10초 안에 재시도한 경우 무한 루프 방지 */
    const last = sessionStorage.getItem('_err_reload')
    const now = Date.now()
    if (!last || now - Number(last) > 10000) {
      sessionStorage.setItem('_err_reload', String(now))
      window.location.reload()
    }
  }, [])

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'Inter, sans-serif' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100svh', gap: 12,
        }}>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
            페이지를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      </body>
    </html>
  )
}
