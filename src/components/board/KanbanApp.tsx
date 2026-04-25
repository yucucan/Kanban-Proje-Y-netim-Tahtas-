'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase'
import { Board, Column, Card } from '@/types'
import { useMounted } from '@/hooks/useMounted'
import Topbar from './Topbar'
import KanbanColumn from './KanbanColumn'
import CardItem from './CardItem'
import CardModal from './CardModal'
import ColumnModal from './ColumnModal'
import BoardsModal from './BoardsModal'

interface Props {
  user: { id: string; email: string; name: string }
  boards: Board[]
  initialColumns: Column[]
  initialCards: Card[]
  currentBoardId: string | null
}

/** Fractional indexing: A ile B arasına kart ekle */
function calcPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1000
  if (before === null) return (after as number) / 2
  if (after === null) return before + 1000
  return (before + after) / 2
}

export default function KanbanApp({
  user,
  boards: initialBoards,
  initialColumns,
  initialCards,
  currentBoardId: initBoardId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const mounted = useMounted()

  const [boards, setBoards] = useState<Board[]>(initialBoards)
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(initBoardId)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const [cardModal, setCardModal] = useState<{ open: boolean; cardId?: string; columnId?: string }>({ open: false })
  const [colModal, setColModal] = useState(false)
  const [boardsModal, setBoardsModal] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (cards.find(c => c.id === event.active.id)) {
      setActiveCardId(event.active.id as string)
    }
  }, [cards])

  // Kart farklı sütuna geçerken optimistic UI
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeCard = cards.find(c => c.id === active.id)
    if (!activeCard) return

    const overCard = cards.find(c => c.id === over.id)
    const overColId = overCard?.column_id ?? columns.find(c => c.id === over.id)?.id
    if (!overColId || overColId === activeCard.column_id) return

    setCards(prev =>
      prev.map(c => c.id === activeCard.id ? { ...c, column_id: overColId } : c)
    )
  }, [cards, columns])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCardId(null)
    if (!over) return

    const activeCard = cards.find(c => c.id === active.id)
    const activeCol = columns.find(c => c.id === active.id)

    if (activeCard) {
      // Kartın bulunduğu sütundaki tüm kartları sırala
      const colCards = cards
        .filter(c => c.column_id === activeCard.column_id)
        .sort((a, b) => a.position - b.position)

      const activeIdx = colCards.findIndex(c => c.id === active.id)

      // over bir kart mı yoksa sütun mu?
      const overCard = cards.find(c => c.id === over.id)
      const overIsColumn = !overCard && !!columns.find(c => c.id === over.id)

      let newPos: number

      if (overIsColumn) {
        // Sütunun üzerine bırakıldı: listenin sonuna ekle
        const lastPos = colCards.length > 0 ? colCards[colCards.length - 1].position : 0
        newPos = lastPos + 1000
      } else if (overCard) {
        // Başka bir kartın üzerine bırakıldı
        const overIdx = colCards.findIndex(c => c.id === over.id)
        if (overIdx === -1) return

        // arrayMove ile yeni sırayı hesapla
        const reordered = arrayMove(colCards, activeIdx, overIdx)
        const newIdx = reordered.findIndex(c => c.id === active.id)

        const prevPos = newIdx > 0 ? reordered[newIdx - 1].position : null
        const nextPos = newIdx < reordered.length - 1 ? reordered[newIdx + 1].position : null
        newPos = calcPosition(prevPos, nextPos)
      } else {
        return
      }

      // Optimistic update
      const previousCards = [...cards]
      setCards(prev =>
        prev.map(c => c.id === activeCard.id
          ? { ...c, position: newPos, column_id: activeCard.column_id }
          : c
        )
      )

      // DB'ye kaydet
      const { error } = await supabase
        .from('cards')
        .update({ column_id: activeCard.column_id, position: newPos })
        .eq('id', activeCard.id)

      if (error) {
        console.error('Card update error:', error)
        setCards(previousCards)
        showToast('Kayıt başarısız, tekrar deneyin.')
      }

    } else if (activeCol) {
      // Sütun sıralama
      const sortedCols = [...columns].sort((a, b) => a.position - b.position)
      const activeIdx = sortedCols.findIndex(c => c.id === active.id)
      const overIdx = sortedCols.findIndex(c => c.id === over.id)
      if (activeIdx === -1 || overIdx === -1) return

      const reordered = arrayMove(sortedCols, activeIdx, overIdx)
      const newIdx = reordered.findIndex(c => c.id === active.id)
      const prevPos = newIdx > 0 ? reordered[newIdx - 1].position : null
      const nextPos = newIdx < reordered.length - 1 ? reordered[newIdx + 1].position : null
      const newPos = calcPosition(prevPos, nextPos)

      const previousColumns = [...columns]
      setColumns(prev =>
        prev.map(c => c.id === activeCol.id ? { ...c, position: newPos } : c)
      )

      const { error } = await supabase
        .from('columns')
        .update({ position: newPos })
        .eq('id', activeCol.id)

      if (error) {
        setColumns(previousColumns)
        showToast('Sütun sıralaması kaydedilemedi.')
      }
    }
  }, [cards, columns, supabase])

  const switchBoard = async (boardId: string) => {
    setCurrentBoardId(boardId)
    const { data: colData } = await supabase.from('columns').select('*').eq('board_id', boardId).order('position')
    const { data: cardData } = await supabase.from('cards').select('*').eq('board_id', boardId).order('position')
    setColumns(colData || [])
    setCards(cardData || [])
    router.push(`/board?boardId=${boardId}`)
  }

  const createBoard = async (title: string) => {
    const { data, error } = await supabase
      .from('boards').insert({ title, user_id: user.id }).select().single()
    if (error || !data) return

    const defaultCols = [
      { board_id: data.id, title: 'Yapılacak', color: '#3b82f6', position: 1000 },
      { board_id: data.id, title: 'Devam Ediyor', color: '#f5a623', position: 2000 },
      { board_id: data.id, title: 'İncelemede', color: '#a855f7', position: 3000 },
      { board_id: data.id, title: 'Tamamlandı', color: '#3ecf8e', position: 4000 },
    ]
    const { data: colData } = await supabase.from('columns').insert(defaultCols).select()
    setBoards(prev => [...prev, data])
    setCurrentBoardId(data.id)
    setColumns(colData || [])
    setCards([])
    router.push(`/board?boardId=${data.id}`)
    showToast('Pano oluşturuldu')
  }

  const deleteBoard = async (boardId: string) => {
    await supabase.from('boards').delete().eq('id', boardId)
    const remaining = boards.filter(b => b.id !== boardId)
    setBoards(remaining)
    if (currentBoardId === boardId) {
      if (remaining.length > 0) switchBoard(remaining[0].id)
      else { setCurrentBoardId(null); setColumns([]); setCards([]) }
    }
    showToast('Pano silindi')
  }

  const addColumn = async (title: string, color: string) => {
    if (!currentBoardId) return
    const maxPos = columns.reduce((m, c) => Math.max(m, c.position), 0)
    const { data, error } = await supabase
      .from('columns').insert({ board_id: currentBoardId, title, color, position: maxPos + 1000 }).select().single()
    if (error || !data) return
    setColumns(prev => [...prev, data])
    showToast('Sütun eklendi')
  }

  const deleteColumn = async (colId: string) => {
    setColumns(prev => prev.filter(c => c.id !== colId))
    setCards(prev => prev.filter(c => c.column_id !== colId))
    await supabase.from('columns').delete().eq('id', colId)
    showToast('Sütun silindi')
  }

  const saveCard = async (data: {
    id?: string; columnId: string; title: string; description: string
    tags: string[]; due_date: string; assignee_name: string; assignee_color: string
  }) => {
    if (!currentBoardId) return

    if (data.id) {
      setCards(prev => prev.map(c =>
        c.id === data.id
          ? { ...c, title: data.title, description: data.description, tags: data.tags, due_date: data.due_date || null, assignee_name: data.assignee_name || null, assignee_color: data.assignee_color || null }
          : c
      ))
      await supabase.from('cards').update({
        title: data.title, description: data.description, tags: data.tags,
        due_date: data.due_date || null, assignee_name: data.assignee_name || null,
        assignee_color: data.assignee_color || null, column_id: data.columnId,
      }).eq('id', data.id)
      showToast('Kart güncellendi')
    } else {
      const colCards = cards.filter(c => c.column_id === data.columnId)
      const maxPos = colCards.reduce((m, c) => Math.max(m, c.position), 0)
      const { data: newCard } = await supabase.from('cards').insert({
        board_id: currentBoardId, column_id: data.columnId, title: data.title,
        description: data.description, tags: data.tags, due_date: data.due_date || null,
        assignee_name: data.assignee_name || null, assignee_color: data.assignee_color || null,
        position: maxPos + 1000,
      }).select().single()
      if (newCard) setCards(prev => [...prev, newCard])
      showToast('Kart eklendi')
    }
  }

  const deleteCard = async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
    await supabase.from('cards').delete().eq('id', cardId)
    showToast('Kart silindi')
  }

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position)
  const activeCard = activeCardId ? cards.find(c => c.id === activeCardId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar
        user={user}
        boards={boards}
        currentBoardId={currentBoardId}
        onSwitchBoard={switchBoard}
        onOpenBoards={() => setBoardsModal(true)}
        onLogout={async () => { await supabase.auth.signOut(); router.push('/auth') }}
      />

      {!currentBoardId ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text3)' }}>
          <span style={{ fontSize: '48px', opacity: 0.3 }}>📋</span>
          <p style={{ fontSize: '16px' }}>Pano seçin veya oluşturun</p>
          <button onClick={() => setBoardsModal(true)} style={{ padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Pano Yönet
          </button>
        </div>
      ) : mounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={{ flex: 1, overflowX: 'auto', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <SortableContext items={sortedColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {sortedColumns.map(col => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  cards={cards.filter(c => c.column_id === col.id).sort((a, b) => a.position - b.position)}
                  onAddCard={() => setCardModal({ open: true, columnId: col.id })}
                  onEditCard={(cardId) => setCardModal({ open: true, cardId, columnId: col.id })}
                  onDeleteColumn={() => deleteColumn(col.id)}
                />
              ))}
            </SortableContext>

            <button
              onClick={() => setColModal(true)}
              style={{ flexShrink: 0, width: '280px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '10px', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text3)' }}
            >
              <span style={{ fontSize: '18px' }}>+</span> Sütun Ekle
            </button>
          </div>

          <DragOverlay>
            {activeCard ? (
              <div style={{ transform: 'scale(1.03)', opacity: 0.9, cursor: 'grabbing', pointerEvents: 'none' }}>
                <CardItem card={activeCard} onEdit={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div style={{ flex: 1, overflowX: 'auto', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {sortedColumns.map(col => (
            <div key={col.id} style={{ flexShrink: 0, width: '280px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', minHeight: '200px' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{col.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CardModal
        open={cardModal.open}
        cardId={cardModal.cardId}
        columnId={cardModal.columnId}
        card={cardModal.cardId ? cards.find(c => c.id === cardModal.cardId) : undefined}
        onClose={() => setCardModal({ open: false })}
        onSave={saveCard}
        onDelete={deleteCard}
      />
      <ColumnModal open={colModal} onClose={() => setColModal(false)} onSave={addColumn} />
      <BoardsModal
        open={boardsModal}
        boards={boards}
        currentBoardId={currentBoardId}
        onClose={() => setBoardsModal(false)}
        onSwitch={switchBoard}
        onCreate={createBoard}
        onDelete={deleteBoard}
      />

      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', zIndex: 999, animation: 'fadeIn 0.3s ease' }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
