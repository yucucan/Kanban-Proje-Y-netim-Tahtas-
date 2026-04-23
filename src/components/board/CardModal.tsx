'use client'

import { useState, useEffect } from 'react'
import { Card, TAG_STYLES, TagType, AVATAR_COLORS } from '@/types'

interface SaveData {
  id?: string
  columnId: string
  title: string
  description: string
  tags: string[]
  due_date: string
  assignee_name: string
  assignee_color: string
}

interface Props {
  open: boolean
  cardId?: string
  columnId?: string
  card?: Card
  onClose: () => void
  onSave: (data: SaveData) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function CardModal({ open, cardId, columnId, card, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [assigneeName, setAssigneeName] = useState('')
  const [assigneeColor, setAssigneeColor] = useState(AVATAR_COLORS[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (card) {
      setTitle(card.title)
      setDescription(card.description || '')
      setTags(card.tags || [])
      setDueDate(card.due_date || '')
      setAssigneeName(card.assignee_name || '')
      setAssigneeColor(card.assignee_color || AVATAR_COLORS[0])
    } else {
      setTitle(''); setDescription(''); setTags([])
      setDueDate(''); setAssigneeName(''); setAssigneeColor(AVATAR_COLORS[0])
    }
  }, [open, card])

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    await onSave({
      id: cardId,
      columnId: columnId!,
      title: title.trim(),
      description,
      tags,
      due_date: dueDate,
      assignee_name: assigneeName,
      assignee_color: assigneeColor,
    })
    setLoading(false)
    onClose()
  }

  async function handleDelete() {
    if (!cardId || !confirm('Bu kartı silmek istediğinizden emin misiniz?')) return
    await onDelete(cardId)
    onClose()
  }

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{cardId ? 'Kartı Düzenle' : 'Kart Ekle'}</span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Title */}
        <MField label="Başlık">
          <MInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Kart başlığı..." autoFocus />
        </MField>

        {/* Description */}
        <MField label="Açıklama">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detaylar, kabul kriterleri..."
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
          />
        </MField>

        {/* Tags */}
        <MField label="Etiketler">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(Object.entries(TAG_STYLES) as [TagType, typeof TAG_STYLES[TagType]][]).map(([key, s]) => (
              <button key={key} onClick={() => toggleTag(key)} style={{
                padding: '4px 10px', borderRadius: '4px', border: '1px solid transparent',
                cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500,
                background: tags.includes(key) ? s.bg : 'var(--bg3)',
                color: tags.includes(key) ? s.text : 'var(--text3)',
                opacity: tags.includes(key) ? 1 : 0.6,
              }}>{s.label}</button>
            ))}
          </div>
        </MField>

        {/* Due date + Assignee */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <MField label="Son Tarih">
            <MInput type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </MField>
          <MField label="Sorumlu">
            <MInput value={assigneeName} onChange={e => setAssigneeName(e.target.value)} placeholder="Ad Soyad" />
          </MField>
        </div>

        {/* Assignee color picker */}
        {assigneeName && (
          <MField label="Renk">
            <div style={{ display: 'flex', gap: '6px' }}>
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => setAssigneeColor(c)} style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: c,
                  border: assigneeColor === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                }} />
              ))}
            </div>
          </MField>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
          {cardId && (
            <button onClick={handleDelete} style={{ padding: '8px 14px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '6px', color: '#f43f5e', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer', marginRight: 'auto' }}>
              Sil
            </button>
          )}
          <button onClick={onClose} style={secondaryBtnStyle}>İptal</button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || loading}
            style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: !title.trim() || loading ? 'not-allowed' : 'pointer', opacity: !title.trim() || loading ? 0.6 : 1 }}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  )
}

function MInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '9px 12px', color: 'var(--text)',
  fontFamily: 'inherit', fontSize: '13px', outline: 'none',
}

const closeBtnStyle: React.CSSProperties = {
  width: '28px', height: '28px', background: 'var(--bg3)', border: 'none',
  borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '14px',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: '6px', color: 'var(--text2)', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer',
}
