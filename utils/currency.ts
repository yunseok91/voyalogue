export function convertToKrw(amount: number, krwPer100: number): number {
  return Math.round((amount / 100) * krwPer100)
}

export function formatKrw(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}
