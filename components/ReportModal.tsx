'use client'

import { useState } from 'react'
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { X, CheckCircle } from 'lucide-react'
import type { User } from 'firebase/auth'

const CATEGORIES = ['버그 신고', '불편한 점', '개선 제안', '기타'] as const

type Props = {
  user: User
  onClose: () => void
}

export function ReportModal({ user, onClose }: Props) {
  const [category,   setCategory]   = useState<string>(CATEGORIES[0])
  const [detail,     setDetail]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async () => {
    if (detail.trim().length < 5) {
      setError('내용을 5자 이상 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const lastMs   = userSnap.data()?.lastReportAt?.toMillis?.() ?? 0
      const diffMs   = Date.now() - lastMs
      if (diffMs < 24 * 60 * 60 * 1000) {
        const hours = Math.ceil((24 * 60 * 60 * 1000 - diffMs) / (60 * 60 * 1000))
        setError(`${hours}시간 후에 다시 보낼 수 있어요.`)
        setSubmitting(false)
        return
      }
      await addDoc(collection(db, 'reports'), {
        reporterUid:   user.uid,
        reporterEmail: user.email ?? '',
        reason:        category,
        targetType:    'feedback',
        targetId:      user.uid,
        detail:        detail.trim(),
        createdAt:     serverTimestamp(),
        status:        'pending',
      })
      await updateDoc(doc(db, 'users', user.uid), { lastReportAt: serverTimestamp() })
      setDone(true)
    } catch {
      setError('전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-[360px] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <>
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-base font-bold text-gray-900 mb-1">접수 완료</p>
              <p className="text-sm text-gray-500">소중한 의견 감사해요. 확인 후 답변 드릴게요.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              확인
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">문의 / 버그 신고</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">유형</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        category === c
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500">내용</label>
                  <span className={`text-[11px] tabular-nums ${detail.length >= 450 ? 'text-orange-500' : 'text-gray-300'}`}>
                    {detail.length}/500
                  </span>
                </div>
                <textarea
                  value={detail}
                  onChange={e => setDetail(e.target.value.slice(0, 500))}
                  placeholder="구체적으로 입력해 주시면 더 빠르게 도움드릴 수 있어요."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none transition-all"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || detail.trim().length < 5}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {submitting
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : '보내기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
