'use client'

import { useEffect } from 'react'

/* 정상 로드 시 GlobalError의 자동 새로고침 플래그 초기화 */
export function ErrorReloadReset() {
  useEffect(() => {
    sessionStorage.removeItem('_err_reload')
  }, [])
  return null
}
