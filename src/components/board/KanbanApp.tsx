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
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase'
import { Board, Column, Card, calcPosition } from '@/types'
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

export default function KanbanApp({
  user,
  boards: initialBoards,
  initialColumns,
  initialCards,
  currentBoardId: initBoardId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  // useMounted: DndContext yalnızca client-side render edilir.
  // Next.js Server Components HTML üretirken dnd-kit ID'leri mevcut değildir;
  // bu hook olmazsa React "hydration mismatch" hatası fırlatır.
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
    setTimeout(() => setToast(''), 2500)
  }

  // Sensörler:
  // - PointerSensor: masaüstü; distance:5 yanlışlıkla tıklamayı önler
  // - TouchSensor: mobil; delay:250 sayfa kaydırma ile çakışmayı önler
  // - KeyboardSensor: klavye erişilebilirliği (a11y)
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

  /**
   * OPTIMISTIC UI — Sütun geçişi (handleDragOver)
   *
   * Kart farklı bir sütuna sürüklendiğinde Supabase'i beklemeden
   * state'i anında güncelliyoruz. Kullanıcı bırakma gerçekleşmeden
   * kartın hedef sütunda "oturduğunu" görür — arayüz donmaz.
   *
   * Asıl DB kaydı handleDragEnd'de, sürükleme bittikten sonra yapılır.
   */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeCard = cards.find(c => c.id === active.id)
    if (!activeCard) return

    const overCard = cards.find(c => c.id === over.id)
    const overColId = overCard?.column_id ?? columns.find(c => c.id === over.id)?.id
    if (!overColId || overColId === activeCard.column_id) return

    // Optimistic: state anında güncellenir, DB beklenmez
    setCards(prev =>
      prev.map(c => c.id === activeCard.id ? { ...c, column_id: overColId } : c)
    )
  }, [cards, columns])

  /**
   * OPTIMISTIC UI — Pozisyon güncelleme (handleDragEnd)
   *
   * Adımlar:
   * 1. Fractional indexing ile yeni pozisyon hesapla:
   *    newPos = (öncekiPos + sonrakiPos) / 2
   * 2. State'i anında güncelle → kullanıcı sonucu hemen görür
   * 3. Supabase'e sadece 1 kayıt UPDATE → veritabanı maliyeti minimum
   * 4. Hata varsa önceki state'e rollback → kullanıcıya bilgi ver
   */
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCardId(null)
    if (!over || active.id === over.id) return

    const activeCard = cards.find(c => c.id === active.id)
    const activeCol = columns.find(c => c.id === active.id)

    if (activeCard) {
      const colCards = cards
        .filter(c => c.column_id === activeCard.column_id)
        .sort((a, b) => a.position - b.position)

      const overIdx = colCards.findIndex(c => c.id === over.id)
      const activeIdx = colCards.findIndex(c => c.id === active.id)
      if (overIdx === -1) return

      const before = overIdx > 0
        ? colCards[activeIdx < overIdx ? overIdx : overIdx - 1]?.position ?? null
        : null
      const after = overIdx < colCards.length - 1
        ? colCards[activeIdx < overIdx ? overIdx + 1 : overIdx]?.position ?? null
        : null
      const newPos = calcPosition(before, after)

      // 1. Optimistic state güncellemesi — kullanıcı beklemez
      const previousCards = cards
      setCards(prev =>
        prev.map(c => c.id === activeCard.id ? { ...c, position: newPos } : c)
      )

      // 2. DB'ye arka planda kaydet — sadece 1 kayıt güncellenir
      const { error } = await supabase
        .from('cards')
        .update({ column_id: activeCard.column_id, position: newPos })
        .eq('id', activeCard.id)

      // 3. Hata varsa rollback
      if (error) {
        setCards(previousCards)
        showToast('Sıralama kaydedilemedi, tekrar deneyin.')
      }

    } else if (activeCol) {
      const sortedCols = [...columns].sort((a, b) => a.position - b.position)
      const overIdx = sortedCols.findIndex(c => c.id === over.id)
      const before = overIdx > 0 ? sortedCols[overIdx - 1]?.position ?? null : null
      const after = sortedCols[overIdx]?.position ?? null
      const newPos = calcPosition(before, after)

      const previousColumns = columns
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
      // Optimistic update
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
      ) : (
        /*
         * useMounted guard: DndContext yalnızca client mount sonrası render edilir.
         * Server HTML'de dnd-kit ID'leri yoktur → hydration mismatch önlenir.
         * mounted=false iken statik iskelet gösterilir (layout shift olmaz).
         */
        mounted ? (
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
                style={{ flexShrink: 0, width: '280px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '10px', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
          // Statik iskelet: sunucu render ile aynı görünür, layout shift olmaz
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
        )
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
