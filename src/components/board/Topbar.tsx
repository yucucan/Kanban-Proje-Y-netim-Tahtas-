'use client'

import { Board } from '@/types'

interface Props {
  user: { id: string; email: string; name: string }
  boards: Board[]
  currentBoardId: string | null
  onSwitchBoard: (id: string) => void
  onOpenBoards: () => void
  onLogout: () => void
}

export default function Topbar({ user, boards, currentBoardId, onSwitchBoard, onOpenBoards, onLogout }: Props) {
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem', height: '52px',
      background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.3px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6" fill="#7c6af7"/>
            <rect x="4" y="6" width="14" height="2.5" rx="1.25" fill="white"/>
            <rect x="4" y="10" width="9" height="2.5" rx="1.25" fill="rgba(255,255,255,0.7)"/>
            <rect x="4" y="14" width="11" height="2.5" rx="1.25" fill="rgba(255,255,255,0.5)"/>
          </svg>
          TaskFlow
        </div>

        {/* Board Selector */}
        <select
          value={currentBoardId || ''}
          onChange={e => onSwitchBoard(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '5px 10px',
            color: 'var(--text)', fontFamily: 'inherit', fontSize: '13px', outline: 'none', cursor: 'pointer',
          }}
        >
          {boards.length === 0 && <option>— Pano yok —</option>}
          {boards.map(b => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Boards button */}
        <button onClick={onOpenBoards} title="Panolar" style={iconBtnStyle}>
          ⊞
        </button>

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg3)', borderRadius: '20px', padding: '5px 12px 5px 5px',
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 600, color: '#fff',
          }}>{initials}</div>
          <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{user.name.split(' ')[0]}</span>
        </div>

        {/* Logout */}
        <button onClick={onLogout} title="Çıkış" style={{ ...iconBtnStyle, color: '#f43f5e' }}>✕</button>
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: '32px', height: '32px',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text2)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '14px',
}
