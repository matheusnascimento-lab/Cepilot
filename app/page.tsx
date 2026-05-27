'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatedBg } from '@/components/AnimatedBg'
import { CustomCursor } from '@/components/CustomCursor'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const key = localStorage.getItem('cefis_key')
    const ob = localStorage.getItem('cefis_onboarding')
    if (key && ob) router.push('/dashboard')
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pass: password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Credenciais inválidas.'); setLoading(false); return }
      localStorage.setItem('cefis_key', data.key)
      localStorage.setItem('cefis_user', JSON.stringify(data.user))
      const hasOnboarding = localStorage.getItem('cefis_onboarding')
      router.push(hasOnboarding ? '/dashboard' : '/onboarding')
    } catch {
      setError('Erro de conexão.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <AnimatedBg />
      <CustomCursor />
      <div className="content" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem' }}>
        <div className={`fade-up`} style={{ textAlign: 'center', marginBottom: '2.5rem', opacity: mounted ? 1 : 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white' }}>C</div>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#F0EEFF' }}>Cepi<span className="gradient-text">lot</span></span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '0.5rem', color: '#F0EEFF', lineHeight: '1.2' }}>
            Seu copiloto<br /><span className="gradient-text-pink">de aprendizado</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.6' }}>Entre com sua conta CEFIS e decole</p>
        </div>

        <div className="card fade-up delay-2" style={{ padding: '2rem' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>E-mail ou CPF</label>
              <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="input-field" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" required />
            </div>
            {error && <div style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>{error}</div>}
            <button type="submit" disabled={loading || !email || !password} className="btn-primary ripple" style={{ width: '100%', fontSize: '0.95rem', padding: '0.875rem', marginTop: '0.25rem' }}>
              {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Entrando...</span> : 'Entrar'}
            </button>
          </form>
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Sem conta? <a href="https://cefis.com.br" target="_blank" rel="noopener noreferrer" style={{ color: '#A78BFA', textDecoration: 'none', fontWeight: '500' }} data-hover>Crie grátis em cefis.com.br</a></p>
          </div>
        </div>
        <p className="fade-up delay-4" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.7rem', color: 'rgba(123,116,148,0.5)' }}>Hackathon CEFIS 2026</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
