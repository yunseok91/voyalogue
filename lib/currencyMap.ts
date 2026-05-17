/**
 * 도시/국가 키워드 → ISO 4217 통화 코드 매핑
 * 여러 통화를 사용하는 나라(스위스, 캄보디아 등)는 배열로 반환
 * 첫 번째 항목이 primary currency
 */
const MAP: [string, string[]][] = [
  // ─ 일본
  ['도쿄', ['JPY']], ['tokyo', ['JPY']], ['오사카', ['JPY']], ['osaka', ['JPY']],
  ['교토', ['JPY']], ['kyoto', ['JPY']], ['후쿠오카', ['JPY']], ['fukuoka', ['JPY']],
  ['삿포로', ['JPY']], ['sapporo', ['JPY']], ['나고야', ['JPY']], ['nagoya', ['JPY']],
  ['나라', ['JPY']], ['nara', ['JPY']], ['히로시마', ['JPY']], ['hiroshima', ['JPY']],
  ['오키나와', ['JPY']], ['okinawa', ['JPY']], ['일본', ['JPY']], ['japan', ['JPY']],
  // ─ 미국
  ['뉴욕', ['USD']], ['new york', ['USD']], ['로스앤젤레스', ['USD']], ['los angeles', ['USD']],
  ['라스베가스', ['USD']], ['las vegas', ['USD']], ['하와이', ['USD']], ['hawaii', ['USD']],
  ['샌프란시스코', ['USD']], ['san francisco', ['USD']], ['시카고', ['USD']], ['chicago', ['USD']],
  ['보스턴', ['USD']], ['boston', ['USD']], ['시애틀', ['USD']], ['seattle', ['USD']],
  ['미국', ['USD']], ['usa', ['USD']], ['united states', ['USD']],
  // ─ 유럽 (EUR)
  ['파리', ['EUR']], ['paris', ['EUR']], ['프랑스', ['EUR']], ['france', ['EUR']],
  ['로마', ['EUR']], ['rome', ['EUR']], ['밀라노', ['EUR']], ['milan', ['EUR']],
  ['이탈리아', ['EUR']], ['italy', ['EUR']], ['바르셀로나', ['EUR']], ['barcelona', ['EUR']],
  ['마드리드', ['EUR']], ['madrid', ['EUR']], ['스페인', ['EUR']], ['spain', ['EUR']],
  ['베를린', ['EUR']], ['berlin', ['EUR']], ['뮌헨', ['EUR']], ['munich', ['EUR']],
  ['독일', ['EUR']], ['germany', ['EUR']], ['암스테르담', ['EUR']], ['amsterdam', ['EUR']],
  ['네덜란드', ['EUR']], ['netherlands', ['EUR']], ['비엔나', ['EUR']], ['vienna', ['EUR']],
  ['오스트리아', ['EUR']], ['austria', ['EUR']], ['프라하', ['EUR']], ['prague', ['EUR']],
  ['체코', ['EUR']], ['아테네', ['EUR']], ['athens', ['EUR']], ['그리스', ['EUR']],
  ['포르투갈', ['EUR']], ['리스본', ['EUR']], ['lisbon', ['EUR']],
  // ─ 영국
  ['런던', ['GBP']], ['london', ['GBP']], ['영국', ['GBP']], ['uk', ['GBP']],
  ['맨체스터', ['GBP']], ['manchester', ['GBP']], ['에든버러', ['GBP']], ['edinburgh', ['GBP']],
  // ─ 태국
  ['방콕', ['THB']], ['bangkok', ['THB']], ['치앙마이', ['THB']], ['chiang mai', ['THB']],
  ['푸켓', ['THB']], ['phuket', ['THB']], ['파타야', ['THB']], ['pattaya', ['THB']],
  ['태국', ['THB']], ['thailand', ['THB']],
  // ─ 베트남
  ['호치민', ['VND']], ['하노이', ['VND']], ['다낭', ['VND']],
  ['호이안', ['VND']], ['나트랑', ['VND']], ['냐짱', ['VND']],
  ['베트남', ['VND']], ['vietnam', ['VND']], ['hanoi', ['VND']],
  ['ho chi minh', ['VND']], ['da nang', ['VND']], ['hoi an', ['VND']],
  // ─ 대만
  ['타이베이', ['TWD']], ['taipei', ['TWD']], ['타이중', ['TWD']], ['가오슝', ['TWD']],
  ['대만', ['TWD']], ['taiwan', ['TWD']],
  // ─ 홍콩
  ['홍콩', ['HKD']], ['hong kong', ['HKD']],
  // ─ 싱가포르
  ['싱가포르', ['SGD']], ['singapore', ['SGD']],
  // ─ 중국
  ['베이징', ['CNY']], ['beijing', ['CNY']], ['상하이', ['CNY']], ['shanghai', ['CNY']],
  ['광저우', ['CNY']], ['guangzhou', ['CNY']], ['선전', ['CNY']], ['shenzhen', ['CNY']],
  ['청두', ['CNY']], ['chengdu', ['CNY']], ['중국', ['CNY']], ['china', ['CNY']],
  // ─ 인도네시아
  ['발리', ['IDR']], ['bali', ['IDR']], ['자카르타', ['IDR']], ['jakarta', ['IDR']],
  ['족자카르타', ['IDR']], ['lombok', ['IDR']], ['롬복', ['IDR']],
  ['인도네시아', ['IDR']], ['indonesia', ['IDR']],
  // ─ 필리핀
  ['마닐라', ['PHP']], ['manila', ['PHP']], ['세부', ['PHP']], ['cebu', ['PHP']],
  ['보라카이', ['PHP']], ['boracay', ['PHP']], ['팔라완', ['PHP']], ['palawan', ['PHP']],
  ['필리핀', ['PHP']], ['philippines', ['PHP']],
  // ─ 말레이시아
  ['쿠알라룸푸르', ['MYR']], ['kuala lumpur', ['MYR']], ['코타키나발루', ['MYR']],
  ['페낭', ['MYR']], ['penang', ['MYR']], ['조호르바루', ['MYR']],
  ['말레이시아', ['MYR']], ['malaysia', ['MYR']],
  // ─ 호주
  ['시드니', ['AUD']], ['sydney', ['AUD']], ['멜버른', ['AUD']], ['melbourne', ['AUD']],
  ['브리즈번', ['AUD']], ['브리즈번', ['AUD']], ['골드코스트', ['AUD']], ['gold coast', ['AUD']],
  ['호주', ['AUD']], ['australia', ['AUD']],
  // ─ 캐나다
  ['밴쿠버', ['CAD']], ['vancouver', ['CAD']], ['토론토', ['CAD']], ['toronto', ['CAD']],
  ['몬트리올', ['CAD']], ['montreal', ['CAD']], ['캐나다', ['CAD']], ['canada', ['CAD']],
  // ─ 튀르키예
  ['이스탄불', ['TRY']], ['istanbul', ['TRY']], ['앙카라', ['TRY']], ['터키', ['TRY']], ['turkey', ['TRY']],
  // ─ 인도
  ['델리', ['INR']], ['delhi', ['INR']], ['뭄바이', ['INR']], ['mumbai', ['INR']],
  ['방갈로르', ['INR']], ['bangalore', ['INR']], ['첸나이', ['INR']], ['인도', ['INR']], ['india', ['INR']],
  // ─ 아랍에미리트
  ['두바이', ['AED']], ['dubai', ['AED']], ['아부다비', ['AED']], ['abu dhabi', ['AED']],
  ['아랍에미리트', ['AED']], ['uae', ['AED']],
  // ─ 스위스 (CHF + EUR 병용)
  ['취리히', ['CHF', 'EUR']], ['zurich', ['CHF', 'EUR']],
  ['제네바', ['CHF', 'EUR']], ['geneva', ['CHF', 'EUR']],
  ['스위스', ['CHF', 'EUR']], ['switzerland', ['CHF', 'EUR']],
  // ─ 캄보디아 (USD + KHR 병용, USD가 실질 통화)
  ['씨엠립', ['USD', 'KHR']], ['siem reap', ['USD', 'KHR']],
  ['프놈펜', ['USD', 'KHR']], ['phnom penh', ['USD', 'KHR']],
  ['캄보디아', ['USD', 'KHR']], ['cambodia', ['USD', 'KHR']],
  // ─ 멕시코
  ['칸쿤', ['MXN']], ['cancun', ['MXN']], ['멕시코시티', ['MXN']], ['mexico city', ['MXN']],
  ['멕시코', ['MXN']], ['mexico', ['MXN']],
  // ─ 뉴질랜드
  ['오클랜드', ['NZD']], ['auckland', ['NZD']], ['뉴질랜드', ['NZD']], ['new zealand', ['NZD']],
  ['퀸스타운', ['NZD']], ['queenstown', ['NZD']],
  // ─ 모로코
  ['마라케시', ['MAD']], ['marrakech', ['MAD']], ['카사블랑카', ['MAD']], ['모로코', ['MAD']], ['morocco', ['MAD']],
  // ─ 라오스
  ['비엔티안', ['LAK']], ['vientiane', ['LAK']], ['루앙프라방', ['LAK']], ['luang prabang', ['LAK']],
  ['라오스', ['LAK']], ['laos', ['LAK']],
  // ─ 미얀마
  ['양곤', ['MMK']], ['yangon', ['MMK']], ['만달레이', ['MMK']], ['mandalay', ['MMK']],
  ['미얀마', ['MMK']], ['myanmar', ['MMK']], ['버마', ['MMK']], ['burma', ['MMK']],
  // ─ 스리랑카
  ['콜롬보', ['LKR']], ['colombo', ['LKR']], ['스리랑카', ['LKR']], ['sri lanka', ['LKR']],
  // ─ 네팔
  ['카트만두', ['NPR']], ['kathmandu', ['NPR']], ['네팔', ['NPR']], ['nepal', ['NPR']],
  // ─ 방글라데시
  ['다카', ['BDT']], ['dhaka', ['BDT']], ['방글라데시', ['BDT']], ['bangladesh', ['BDT']],
  // ─ 브라질
  ['상파울루', ['BRL']], ['sao paulo', ['BRL']], ['리우데자네이루', ['BRL']], ['rio', ['BRL']],
  ['브라질', ['BRL']], ['brazil', ['BRL']],
  // ─ 아르헨티나
  ['부에노스아이레스', ['ARS']], ['buenos aires', ['ARS']], ['아르헨티나', ['ARS']], ['argentina', ['ARS']],
  // ─ 콜롬비아
  ['보고타', ['COP']], ['bogota', ['COP']], ['콜롬비아', ['COP']], ['colombia', ['COP']],
  // ─ 페루
  ['리마', ['PEN']], ['lima', ['PEN']], ['페루', ['PEN']], ['peru', ['PEN']],
  // ─ 남아프리카공화국
  ['케이프타운', ['ZAR']], ['cape town', ['ZAR']], ['요하네스버그', ['ZAR']], ['johannesburg', ['ZAR']],
  ['남아공', ['ZAR']], ['south africa', ['ZAR']],
  // ─ 이집트
  ['카이로', ['EGP']], ['cairo', ['EGP']], ['이집트', ['EGP']], ['egypt', ['EGP']],
  // ─ 체코 (CZK)
  ['프라하', ['CZK']], ['prague', ['CZK']], ['체코', ['CZK']], ['czech', ['CZK']],
  // ─ 헝가리
  ['부다페스트', ['HUF']], ['budapest', ['HUF']], ['헝가리', ['HUF']], ['hungary', ['HUF']],
  // ─ 폴란드
  ['바르샤바', ['PLN']], ['warsaw', ['PLN']], ['크라쿠프', ['PLN']], ['krakow', ['PLN']],
  ['폴란드', ['PLN']], ['poland', ['PLN']],
  // ─ 덴마크
  ['코펜하겐', ['DKK']], ['copenhagen', ['DKK']], ['덴마크', ['DKK']], ['denmark', ['DKK']],
  // ─ 스웨덴
  ['스톡홀름', ['SEK']], ['stockholm', ['SEK']], ['스웨덴', ['SEK']], ['sweden', ['SEK']],
  // ─ 노르웨이
  ['오슬로', ['NOK']], ['oslo', ['NOK']], ['노르웨이', ['NOK']], ['norway', ['NOK']],
  // ─ 사우디아라비아
  ['리야드', ['SAR']], ['riyadh', ['SAR']], ['제다', ['SAR']], ['jeddah', ['SAR']],
  ['사우디', ['SAR']], ['saudi', ['SAR']], ['saudi arabia', ['SAR']],
  // ─ 이스라엘
  ['텔아비브', ['ILS']], ['tel aviv', ['ILS']], ['예루살렘', ['ILS']], ['jerusalem', ['ILS']],
  ['이스라엘', ['ILS']], ['israel', ['ILS']],
]

export function detectCurrencies(city: string): string[] {
  const lower = city.toLowerCase().trim()
  for (const [keyword, currencies] of MAP) {
    if (lower.includes(keyword.toLowerCase())) return currencies
  }
  return ['KRW']
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  KRW: '₩', JPY: '¥', USD: '$', EUR: '€', GBP: '£', THB: '฿',
  VND: '₫', TWD: 'NT$', HKD: 'HK$', SGD: 'S$', CNY: '¥', IDR: 'Rp',
  PHP: '₱', MYR: 'RM', AUD: 'A$', CAD: 'C$', TRY: '₺', INR: '₹',
  AED: 'د.إ', CHF: 'CHF', KHR: '៛', MXN: '$', NZD: 'NZ$', MAD: 'MAD',
  LAK: '₭', MMK: 'K', LKR: 'Rs', NPR: 'Rs', BDT: '৳',
  BRL: 'R$', ARS: '$', COP: '$', PEN: 'S/', ZAR: 'R',
  EGP: 'E£', CZK: 'Kč', HUF: 'Ft', PLN: 'zł',
  DKK: 'kr', SEK: 'kr', NOK: 'kr', SAR: '﷼', ILS: '₪',
}

export const CURRENCY_NAMES: Record<string, string> = {
  KRW: '한국 원', JPY: '일본 엔', USD: '미국 달러', EUR: '유로', GBP: '영국 파운드',
  THB: '태국 바트', VND: '베트남 동', TWD: '대만 달러', HKD: '홍콩 달러',
  SGD: '싱가포르 달러', CNY: '중국 위안', IDR: '인도네시아 루피아', PHP: '필리핀 페소',
  MYR: '말레이시아 링깃', AUD: '호주 달러', CAD: '캐나다 달러', TRY: '튀르키예 리라',
  INR: '인도 루피', AED: '아랍에미리트 디르함', CHF: '스위스 프랑',
  KHR: '캄보디아 리엘', MXN: '멕시코 페소', NZD: '뉴질랜드 달러', MAD: '모로코 디르함',
  LAK: '라오스 킵', MMK: '미얀마 짯', LKR: '스리랑카 루피', NPR: '네팔 루피',
  BDT: '방글라데시 타카', BRL: '브라질 헤알', ARS: '아르헨티나 페소',
  COP: '콜롬비아 페소', PEN: '페루 솔', ZAR: '남아공 랜드',
  EGP: '이집트 파운드', CZK: '체코 코루나', HUF: '헝가리 포린트',
  PLN: '폴란드 즐로티', DKK: '덴마크 크로네', SEK: '스웨덴 크로나',
  NOK: '노르웨이 크로네', SAR: '사우디 리얄', ILS: '이스라엘 세켈',
}

/** 소수점 없이 표시하는 통화 (정수 단위가 기본인 통화) */
export const ZERO_DECIMAL: Set<string> = new Set(['JPY', 'VND', 'IDR', 'KRW', 'KHR', 'LAK', 'MMK', 'HUF'])
