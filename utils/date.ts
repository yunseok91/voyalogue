export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function tripDuration(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}
