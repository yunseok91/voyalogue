import { ZERO_DECIMAL } from './currencyMap'

/** 캐시: 1 시간 */
const CACHE_MS = 60 * 60 * 1000
let cache: { rates: Record<string, number>; fetchedAt: number } | null = null

/**
 * open.er-api.com 무료 API를 사용해 KRW 기준 환율을 가져옵니다.
 * 반환값: { JPY: 9.35, USD: 1340, ... } — 1 외화 = N KRW
 */
export async function getRatesInKRW(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.rates
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/KRW')
    const data = await res.json()
    if (data.result !== 'success') throw new Error('API error')
    // data.rates[X] = 1 KRW 당 X 통화 → 역수가 1 X 당 KRW
    const rates: Record<string, number> = { KRW: 1 }
    for (const [code, val] of Object.entries(data.rates as Record<string, number>)) {
      if (val && val > 0) rates[code] = 1 / val
    }
    cache = { rates, fetchedAt: Date.now() }
    return rates
  } catch {
    return cache?.rates ?? { KRW: 1 }
  }
}

/** amount(외화) → KRW 환산 */
export function toKRW(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === 'KRW' || amount <= 0) return amount
  return Math.round(amount * (rates[currency] ?? 1))
}

/** 현지 통화 표시 문자열 (예: ¥1,000 / ₫50,000) */
export function formatLocal(amount: number, currency: string): string {
  if (amount <= 0) return ''
  const decimals = ZERO_DECIMAL.has(currency) ? 0 : 2
  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: decimals,
      minimumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currency}`
  }
}

/** KRW 표시 문자열 (예: 3,000원 / 2만원 / 489,400원) */
export function formatKRW(n: number): string {
  if (n <= 0) return ''
  const r = Math.round(n)
  return r % 10000 === 0
    ? `${(r / 10000).toLocaleString()}만원`
    : `${r.toLocaleString()}원`
}
