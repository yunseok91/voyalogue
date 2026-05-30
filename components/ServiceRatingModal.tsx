'use client'

import { useState, useEffect } from 'react'
import { Star, X, Check } from 'lucide-react'
import { addDoc, updateDoc, collection, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/features/auth/store'

interface Props {
  onClose: () => void
}

const LABELS = ['', '별로였어요', '아쉬웠어요', '보통이에요', '좋았어요', '최고예요!']

export function ServiceRatingModal({ onClose }: Props) {
  const { user } = useAuthStore()
  const [rating,     setRating]     = useState(0)
  const [hover,      setHover]      = useState(0)
  const [text,       setText]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [done,       setDone]       = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  useEffect(() => {
    if (!user) { setLoadingExisting(false); return }
    getDocs(query(collection(db, 'serviceReviews'), where('uid', '==', user.uid)))
      .then(snap => {
        if (!snap.empty) {
          const d = snap.docs[0]
          const data = d.data()
          setExistingId(d.id)
          setRating(data.rating ?? 0)
          setText(data.text ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false))
  }, [user])

  const handleSubmit = async () => {
    if (!user || rating === 0) return
    setSaving(true)
    try {
      if (existingId) {
        await updateDoc(doc(db, 'serviceReviews', existingId), {
          rating,
          text:        text.trim(),
          displayName: user.displayName ?? '익명',
          photoURL:    user.photoURL ?? null,
          updatedAt:   serverTimestamp(),
        })
      } else {
        const newDoc = await addDoc(collection(db, 'serviceReviews'), {
          uid:         user.uid,
          displayName: user.displayName ?? '익명',
          photoURL:    user.photoURL ?? null,
          rating,
          text:        text.trim(),
          featured:    false,
          createdAt:   serverTimestamp(),
        })
        setExistingId(newDoc.id)
      }
      setDone(true)
      setTimeout(onClose, 2000)
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const isEdit = !!existingId

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-4">

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-base font-extrabold text-gray-900">감사합니다!</p>
            <p className="text-sm text-gray-500">
              {isEdit ? '후기가 수정되었어요.' : '소중한 후기를 남겨주셨어요.'}
            </p>
          </div>
        ) : loadingExisting ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-gray-900 text-base">
                  {isEdit ? '후기 수정하기' : '서비스 후기 남기기'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">Voyalogue는 어떠셨나요?</p>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-9 h-9 transition-colors ${s <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
              <p className={`h-4 text-center text-xs font-semibold text-blue-600 transition-opacity ${(hover || rating) > 0 ? 'opacity-100' : 'opacity-0'}`}>
                {LABELS[hover || rating] ?? ''}
              </p>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="어떤 점이 도움이 됐나요? (선택 사항)"
              className="w-full h-20 px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-blue-400 transition-colors"
              maxLength={200}
            />
            <p className="text-right text-[11px] text-gray-400 -mt-2">{text.length}/200</p>

            {/* 데이터 보존 정책 안내 */}
            <p className="text-[11px] text-gray-400 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5">
              후기는 서비스 개선을 위해 <span className="font-semibold text-gray-500">회원 탈퇴 후에도 영구 보존</span>됩니다.
              단, 이름·프로필 사진은 탈퇴 시 익명으로 처리됩니다.
            </p>

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                나중에
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || saving}
                className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                {saving ? '저장 중…' : isEdit ? '수정 완료' : '후기 등록'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
