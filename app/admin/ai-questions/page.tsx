'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_QUESTIONS, type AiQuestion } from '@/components/AiTripPlanner'
import { Save, RotateCcw, GripVertical, Check, X } from 'lucide-react'

export default function AiQuestionsAdmin() {
  const [questions, setQuestions] = useState<AiQuestion[]>(DEFAULT_QUESTIONS)
  const [saving, setSaving]       = useState(false)
  const [saved,  setSaved]        = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editOptions, setEditOptions] = useState('')

  useEffect(() => {
    getDoc(doc(db, 'config', 'aiPlannerQuestions')).then(snap => {
      if (!snap.exists()) return
      const data = snap.data()
      if (Array.isArray(data.questions)) {
        const overrides: Record<string, Partial<AiQuestion>> = {}
        for (const q of data.questions) overrides[q.id] = q
        setQuestions(DEFAULT_QUESTIONS.map(q => ({ ...q, ...overrides[q.id] })))
      }
    }).catch(() => {})
  }, [])

  const toggle = (id: string) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, enabled: !q.enabled } : q))
  }

  const startEditOptions = (q: AiQuestion) => {
    setEditingId(q.id)
    setEditOptions(q.options?.map(o => `${o.emoji ?? ''}${o.label}`).join('\n') ?? '')
  }

  const saveEditOptions = (id: string) => {
    const lines = editOptions.split('\n').map(l => l.trim()).filter(Boolean)
    const options = lines.map(l => {
      const emojiMatch = l.match(/^(\p{Emoji_Presentation}|\p{Emoji}️)\s*/u)
      const emoji  = emojiMatch ? emojiMatch[0].trim() : undefined
      const label  = emoji ? l.replace(emojiMatch![0], '').trim() : l
      return { label, value: label, ...(emoji ? { emoji } : {}) }
    })
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, options } : q))
    setEditingId(null)
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setQuestions(qs => {
      const next = [...qs]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((q, i) => ({ ...q, order: i + 1 }))
    })
  }

  const moveDown = (idx: number) => {
    setQuestions(qs => {
      if (idx >= qs.length - 1) return qs
      const next = [...qs]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((q, i) => ({ ...q, order: i + 1 }))
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', 'aiPlannerQuestions'), { questions }, { merge: false })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirm('기본값으로 초기화 하시겠습니까?')) return
    setQuestions(DEFAULT_QUESTIONS)
  }

  const TYPE_LABEL: Record<string, string> = {
    text: '텍스트', select: '단일선택', multiselect: '복수선택', date_nights: '날짜+박수',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">AI 플래너 질문 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">질문 활성화/비활성화, 순서, 선택지 수정</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 초기화
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saved
              ? <><Check className="w-3.5 h-3.5" /> 저장됨</>
              : saving
                ? '저장 중…'
                : <><Save className="w-3.5 h-3.5" /> 저장</>
            }
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className={`bg-white rounded-2xl border p-4 transition-all ${
              q.enabled ? 'border-gray-200' : 'border-gray-100 opacity-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* 순서 이동 */}
              <div className="flex flex-col gap-0.5 pt-0.5">
                <button onClick={() => moveUp(idx)}   className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors text-xs">▲</button>
                <button onClick={() => moveDown(idx)} className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors text-xs">▼</button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-gray-900">{q.label}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {TYPE_LABEL[q.type]}
                  </span>
                  {q.required && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">필수</span>
                  )}
                </div>

                {/* 선택지 */}
                {q.options && editingId !== q.id && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {q.options.map(o => (
                      <span key={o.value} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {o.emoji} {o.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* 선택지 편집 */}
                {q.options && editingId === q.id && (
                  <div className="mb-2">
                    <textarea
                      value={editOptions}
                      onChange={e => setEditOptions(e.target.value)}
                      rows={q.options.length + 1}
                      placeholder="한 줄에 하나씩 입력 (이모지 포함 가능)&#10;예: 🍜 맛집탐방"
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 font-mono resize-none"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => saveEditOptions(q.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                      >
                        <Check className="w-3 h-3" /> 확인
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg"
                      >
                        <X className="w-3 h-3" /> 취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 선택지 편집 버튼 */}
                {q.options && editingId !== q.id && (
                  <button
                    onClick={() => startEditOptions(q)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    선택지 수정
                  </button>
                )}
              </div>

              {/* 활성화 토글 */}
              <button
                onClick={() => toggle(q.id)}
                disabled={q.required && q.enabled}
                className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                  q.enabled ? 'bg-blue-600' : 'bg-gray-200'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={q.required ? '필수 질문은 비활성화할 수 없습니다' : ''}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${q.enabled ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        저장 시 Firestore <code className="bg-gray-100 px-1 rounded">config/aiPlannerQuestions</code>에 반영됩니다
      </p>
    </div>
  )
}
