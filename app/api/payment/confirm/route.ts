import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { paymentKey, orderId, amount } = await req.json()

  // 금액 검증 — 위변조 방지
  if (Number(amount) !== 500) {
    return NextResponse.json({ ok: false, message: '잘못된 결제 금액입니다.' }, { status: 400 })
  }

  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ ok: false, message: '결제 설정 오류' }, { status: 500 })
  }

  const basicToken = Buffer.from(`${secretKey}:`).toString('base64')

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })

  const data = await tossRes.json()

  if (!tossRes.ok) {
    return NextResponse.json(
      { ok: false, message: data.message ?? '결제 승인 실패' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, paymentKey: data.paymentKey })
}
