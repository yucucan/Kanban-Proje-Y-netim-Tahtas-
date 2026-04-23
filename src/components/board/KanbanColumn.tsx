'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Column, Card } from '@/types'
import CardItem from './CardItem'

interface Props {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onEditCard: (cardId: string) => void
  onDeleteColumn: () => void
}

export default function KanbanColumn({ column, cards, onAddCard, onEditCard, onDeleteColumn }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        flexShrink: 0, width: '280px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        display: 'flex', flexDirection: 'column',
        maxHeight: 'calc(100vh - 130px)',
      }}
    >
      {/* Column Header — drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          cursor: 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: column.color }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{column.title}</span>
          <span style={{
            fontSize: '11px', background: 'var(--bg3)', borderRadius: '10px',
            padding: '1px 7px', color: 'var(--text3)', fontFamily: 'DM Mono, monospace',
          }}>{cards.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
          <ColBtn onClick={onAddCard} title="Kart ekle">+</ColBtn>
          <ColBtn onClick={() => { if (confirm('Sütunu silmek istiyor musunuz?')) onDeleteColumn() }} title="Sil">🗑</ColBtn>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px',
        display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px',
      }}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <CardItem key={card.id} card={card} onEdit={() => onEditCard(card.id)} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div style={{
            textAlign: 'center', color: 'var(--text3)', fontSize: '12px',
            padding: '1.5rem 0', border: '1px dashed var(--border)', borderRadius: '6px',
          }}>Kart yok</div>
        )}
      </div>

      {/* Add Card */}
      <button onClick={onAddCard} style={{
        margin: '0 10px 10px', padding: '8px',
        background: 'none', border: '1px dashed var(--border)', borderRadius: '6px',
        color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px',
        transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0,
      }}
        onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--accent)'; (e.currentTarget).style.color = 'var(--accent)' }}
        onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.color = 'var(--text3)' }}
      >
        + Kart ekle
      </button>
    </div>
  )
}

function ColBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: '24px', height: '24px', background: 'none', border: 'none',
      color: 'var(--text3)', cursor: 'pointer', borderRadius: '4px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
    }}>
      {children}
    </button>
  )
}
