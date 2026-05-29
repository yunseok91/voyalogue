'use client'

import { useDroppable } from '@dnd-kit/core'

export function SlotDropZone({ slot }: { slot: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot}` })
  return (
    <div
      ref={setNodeRef}
      className={`h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
        isOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <span className={`text-[11px] ${isOver ? 'text-blue-500 font-semibold' : 'text-gray-300'}`}>
        {isOver ? '여기에 놓기' : '일정을 드래그하세요'}
      </span>
    </div>
  )
}
