'use client'

import { useEffect, useState } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, Timestamp, orderBy, query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'

type AnnouncementType = 'notice' | 'event' | 'maintenance'

type Announcement = {
  id: string
  title: string
  body: string
  type: AnnouncementType
  active: boolean
  createdAt: Timestamp
}

const TYPE_META: Record<AnnouncementType, { label: string; cls: string }> = {
  notice:      { label: '공지',  cls: 'bg-blue-100 text-blue-700' },
  event:       { label: '이벤트', cls: 'bg-green-100 text-green-700' },
  maintenance: { label: '점검',  cls: 'bg-orange-100 text-orange-700' },
}

const EMPTY_FORM = { title: '', body: '', type: 'notice' as AnnouncementType, active: true }

export default function AdminAnnouncementsPage() {
  const [list, setList]         = useState<Announcement[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Announcement | null>(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')))
      setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)))
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({ title: a.title, body: a.body, type: a.type, active: a.active })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null) }

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateDoc(doc(db, 'announcements', editing.id), {
          title: form.title, body: form.body, type: form.type, active: form.active,
        })
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...form,
          createdAt: Timestamp.now(),
        })
      }
      await load()
      closeForm()
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 공지사항을 삭제할까요?')) return
    try {
      await deleteDoc(doc(db, 'announcements', id))
      setList(prev => prev.filter(a => a.id !== id))
    } catch { /* silent */ }
  }

  const handleToggleActive = async (a: Announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', a.id), { active: !a.active })
      setList(prev => prev.map(item => item.id === a.id ? { ...item, active: !item.active } : item))
    } catch { /* silent */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          공지사항 관리
        </h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 공지
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="h-4 w-12 bg-gray-100 rounded" />
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">공지사항 없음</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map(a => (
              <div key={a.id} className="px-5 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_META[a.type].cls}`}>
                      {TYPE_META[a.type].label}
                    </span>
                    {!a.active && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        비활성
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.body}</p>
                  <p className="text-[11px] text-gray-300 mt-1">
                    {a.createdAt ? new Date(a.createdAt.toMillis()).toLocaleDateString('ko') : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(a)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    title={a.active ? '비활성화' : '활성화'}
                  >
                    {a.active
                      ? <ToggleRight className="w-5 h-5 text-blue-500" />
                      : <ToggleLeft className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 폼 모달 */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeForm}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {editing ? '공지사항 수정' : '새 공지사항'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">유형</label>
                <div className="flex gap-2">
                  {(Object.keys(TYPE_META) as AnnouncementType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        form.type === t ? TYPE_META[t].cls : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  placeholder="공지사항 제목"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">내용</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
                  placeholder="공지사항 내용"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">활성화 (앱에 노출)</span>
              </label>
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.body.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
