'use client'

import { useState } from 'react'
import { Board } from '@/types'

interface Props {
  open: boolean
  boards: Board[]
  currentBoardId: string | null
  onClose: () => void
  onSwitch: (id: string) => void
  onCreate: (title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function BoardsModal({ open, boards, currentBoardId, onClose, onSwitch, onCreate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setLoading(true)
    await onCreate(newName.trim())
    setNewName('')
    setLoading(false)
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
        borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '400px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Panolar</span>
          <button onClick={onClose} style={{ width: '28px', height: '28px', background: 'var(--bg3)', border: 'none', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Board list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
          {boards.length === 0 && (
            <div style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '1rem' }}>Henüz pano yok</div>
          )}
          {boards.map(b => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', background: 'var(--bg3)',
              borderRadius: '6px', border: b.id === currentBoardId ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: 'pointer', transition: 'all 0.15s',
              background: b.id === currentBoardId ? 'rgba(124,106,247,0.1)' : 'var(--bg3)',
            }} onClick={() => { onSwitch(b.id); onClose() }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{b.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                  {new Date(b.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); if (confirm('Panoyu silmek istiyor musunuz?')) onDelete(b.id) }} style={{
                width: '24px', height: '24px', background: 'none', border: 'none',
                color: 'var(--text3)', cursor: 'pointer', borderRadius: '4px', fontSize: '12px',
              }} title="Sil">✕</button>
            </div>
          ))}
        </div>

        {/* Create new */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            placeholder="Yeni pano adı..."
            style={{
              flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '9px 12px', color: 'var(--text)',
              fontFamily: 'inherit', fontSize: '13px', outline: 'none',
            }}
          />
          <button onClick={handleCreate} disabled={!newName.trim() || loading} style={{
            padding: '8px 16px', background: 'var(--accent)', border: 'none',
            borderRadius: '6px', color: '#fff', fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: !newName.trim() || loading ? 'not-allowed' : 'pointer',
            opacity: !newName.trim() || loading ? 0.6 : 1, whiteSpace: 'nowrap',
          }}>Oluştur</button>
        </div>
      </div>
    </div>
  )
}
