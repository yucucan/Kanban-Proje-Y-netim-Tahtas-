'use client'

import { useState } from 'react'
import { COLUMN_COLORS } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (title: string, color: string) => Promise<void>
}

export default function ColumnModal({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(COLUMN_COLORS[0].value)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    await onSave(title.trim(), color)
    setLoading(false)
    setTitle('')
    setColor(COLUMN_COLORS[0].value)
    onClose()
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '320px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Sütun Ekle</span>
          <button onClick={onClose} style={{ width: '28px', height: '28px', background: 'var(--bg3)', border: 'none', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sütun Adı</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            placeholder="Yapılacaklar..."
            autoFocus
            style={{
              width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '9px 12px', color: 'var(--text)',
              fontFamily: 'inherit', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Renk</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLUMN_COLORS.map(c => (
              <button key={c.value} onClick={() => setColor(c.value)} title={c.label} style={{
                width: '28px', height: '28px', borderRadius: '50%', background: c.value,
                border: color === c.value ? '2px solid white' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}>İptal</button>
          <button onClick={handleSave} disabled={!title.trim() || loading} style={{
            padding: '8px 16px', background: 'var(--accent)', border: 'none',
            borderRadius: '6px', color: '#fff', fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: !title.trim() || loading ? 'not-allowed' : 'pointer',
            opacity: !title.trim() || loading ? 0.6 : 1,
          }}>Ekle</button>
        </div>
      </div>
    </div>
  )
}
