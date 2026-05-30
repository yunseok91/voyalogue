'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Star, CheckCircle2, Circle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

type Review = {
  id:          string
  uid:         string
  displayName: string
  photoURL:    string | null
  rating:      number
  text:        string
  featured:    boolean
  createdAt:   { toDate(): Date } | null
}

export default function AdminReviewsPage() {
  const [reviews,  setReviews]  = useState<Review[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    getDocs(query(collection(db, 'serviceReviews'), orderBy('createdAt', 'desc')))
      .then(snap => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleFeatured = async (r: Review) => {
    setToggling(r.id)
    try {
      const next = !r.featured
      await updateDoc(doc(db, 'serviceReviews', r.id), { featured: next })
      setReviews(prev => prev.map(x => x.id === r.id ? { ...x, featured: next } : x))
    } catch { /* silent */ } finally {
      setToggling(null)
    }
  }

  const featuredCount = reviews.filter(r => r.featured).length

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-3xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">서비스 후기 관리</h1>
            <p className="text-sm text-gray-400">체크한 후기가 메인 페이지 "솔직한 후기"에 노출됩니다</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="flex gap-2 mb-5">
          <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-full">
            전체 {reviews.length}개
          </span>
          <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
            노출중 {featuredCount}개
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            아직 등록된 후기가 없어요
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border p-5 flex gap-4 transition-all ${
                  r.featured ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200'
                }`}
              >
                {/* 노출 토글 */}
                <button
                  onClick={() => toggleFeatured(r)}
                  disabled={toggling === r.id}
                  className="flex-shrink-0 mt-0.5 disabled:opacity-40 transition-opacity"
                  title={r.featured ? '노출 해제' : '메인 노출'}
                >
                  {r.featured
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                  }
                </button>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {r.photoURL && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                    )}
                    <p className="text-sm font-semibold text-gray-900">{r.displayName || '익명'}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {r.createdAt ? r.createdAt.toDate().toLocaleDateString('ko-KR') : ''}
                    </span>
                  </div>
                  {r.text ? (
                    <p className="text-sm text-gray-600 leading-relaxed">"{r.text}"</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">텍스트 후기 없음</p>
                  )}
                  {r.featured && (
                    <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      메인 노출중
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
