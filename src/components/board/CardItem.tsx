'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, TAG_STYLES, TagType } from '@/types'

interface Props {
  card: Card
  onEdit: () => void
  isDragging?: boolean
}

export default function CardItem({ card, onEdit, isDragging: isOverlay }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = card.due_date && new Date(card.due_date) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bg3)',
        border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '6px',
        padding: '12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging && !isOverlay ? 0.35 : 1,
        transition: 'border-color 0.15s, transform 0.15s',
        position: 'relative',
        boxShadow: isOverlay ? '0 8px 24px rgba(0,0,0,0.4)' : undefined,
      }}
      onClick={onEdit}
      {...attributes}
      {...listeners}
    >
      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {card.tags.map(tag => {
            const s = TAG_STYLES[tag as TagType]
            if (!s) return null
            return (
              <span key={tag} style={{
                fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                background: s.bg, color: s.text, fontFamily: 'DM Mono, monospace', fontWeight: 500,
              }}>{s.label}</span>
            )
          })}
        </div>
      )}

      {/* Title */}
      <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4, color: 'var(--text)', marginBottom: '8px' }}>
        {card.title}
      </div>

      {/* Description preview */}
      {card.description && (
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', lineHeight: 1.4 }}>
          {card.description.slice(0, 80)}{card.description.length > 80 ? '...' : ''}
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {card.assignee_name ? (
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: card.assignee_color || '#7c6af7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 600, color: '#fff',
            title: card.assignee_name,
          }}>
            {card.assignee_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        ) : <div />}
        {card.due_date && (
          <span style={{
            fontSize: '10px', fontFamily: 'DM Mono, monospace',
            color: isOverdue ? '#f43f5e' : 'var(--text3)',
          }}>
            {card.due_date}
          </span>
        )}
      </div>

      {/* Edit button (hover) */}
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        style={{
          position: 'absolute', top: '8px', right: '8px',
          width: '20px', height: '20px',
          background: 'var(--bg4)', border: 'none', borderRadius: '4px',
          color: 'var(--text3)', cursor: 'pointer', fontSize: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Düzenle"
      >✎</button>
    </div>
  )
}
