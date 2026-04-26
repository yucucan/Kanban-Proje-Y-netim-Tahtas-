'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/board')
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/board')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,106,247,0.12) 0%, transparent 70%)',
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '380px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#7c6af7"/>
            <rect x="6" y="8" width="16" height="3" rx="1.5" fill="white"/>
            <rect x="6" y="13" width="10" height="3" rx="1.5" fill="rgba(255,255,255,0.7)"/>
            <rect x="6" y="18" width="12" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.5px' }}>TaskFlow</span>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '6px', padding: '3px', marginBottom: '1.5rem' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, padding: '7px', border: 'none',
              background: tab === t ? 'var(--bg)' : 'none',
              color: tab === t ? 'var(--text)' : 'var(--text3)',
              cursor: 'pointer', borderRadius: '5px', fontFamily: 'inherit',
              fontSize: '13px', fontWeight: 500,
            }}>
              {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          ))}
        </div>

        <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
          {tab === 'register' && (
            <Field label="Ad Soyad">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ahmet Yılmaz" required />
            </Field>
          )}
          <Field label="E-posta">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@mail.com" required />
          </Field>
          <Field label="Şifre">
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </Field>
          {error && <p style={{ fontSize: '12px', color: '#f43f5e', marginBottom: '0.75rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px',
            background: loading ? 'var(--bg3)' : 'var(--accent)',
            border: 'none', borderRadius: '6px', color: '#fff',
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Yükleniyor...' : tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{
      width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: '6px', padding: '9px 12px', color: 'var(--text)',
      fontFamily: 'inherit', fontSize: '13px', outline: 'none',
    }} />
  )
}
