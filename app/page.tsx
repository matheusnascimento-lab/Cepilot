'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      if (!res.ok) {
        setError(data.message || 'Credenciais inválidas. Verifique seu e-mail e senha.')
        setLoading(false)
        return
      }

      localStorage.setItem('cefis_key', data.key)
      localStorage.setItem('cefis_user', JSON.stringify(data.user))

      const hasOnboarding = localStorage.getItem('cefis_onboarding')
      if (hasOnboarding) {
        router.push('/tutor')
      } else {
        router.push('/onboarding')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #0D1628 0%, #070B14 60%, #111D2E 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #E8A94D 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #38B2AC 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8A94D, #D4922B)' }}>
              <span className="text-black font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#F2EDE6' }}>
              CEFIS
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <div className="inline-block text-xs font-medium tracking-widest uppercase mb-6 px-3 py-1 rounded-full"
            style={{ color: '#E8A94D', border: '1px solid rgba(232,169,77,0.3)', background: 'rgba(232,169,77,0.05)' }}>
            Hackathon de Inovação 2026
          </div>

          <h1 className="text-5xl font-normal leading-tight mb-6"
            style={{ fontFamily: 'Playfair Display, serif', color: '#F2EDE6' }}>
            Seu tutor de<br />
            <em style={{ color: '#E8A94D' }}>aprendizado</em><br />
            inteligente
          </h1>

          <p className="text-base leading-relaxed" style={{ color: '#8B96A7', maxWidth: '380px' }}>
            Um tutor que realmente te conhece. Que entende onde você quer chegar e
            traça com você o caminho mais inteligente para lá.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {[
            { n: '500+', label: 'Cursos disponíveis' },
            { n: '4.8', label: 'Avaliação média' },
            { n: '100%', label: 'Personalizado' },
          ].map((s) => (
            <div key={s.n}>
              <div className="text-2xl font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#E8A94D' }}>
                {s.n}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8B96A7' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16"
        style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8A94D, #D4922B)' }}>
              <span className="text-black font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>CEFIS Mentor</span>
          </div>

          <div className="animate-fade-up">
            <h2 className="text-3xl font-medium mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}>
              Bem-vindo de volta
            </h2>
            <p className="text-sm mb-8" style={{ color: '#8B96A7' }}>
              Entre com sua conta CEFIS para acessar seu tutor personalizado
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: '#8B96A7' }}>
                  E-mail ou CPF
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-field"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: '#8B96A7' }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg animate-fade-in"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FC8181' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                style={{ fontSize: '0.95rem', padding: '0.875rem' }}>
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'transparent', borderTopColor: '#0a0a0a' }} />
                    Entrando...
                  </>
                ) : 'Entrar no Mentor CEFIS'}
              </button>
            </form>

            <div className="mt-6 pt-6 text-center"
              style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: '#8B96A7' }}>
                Não tem conta?{' '}
                <a href="https://cefis.com.br" target="_blank" rel="noopener noreferrer"
                  className="hover:underline" style={{ color: '#E8A94D' }}>
                  Crie gratuitamente em cefis.com.br
                </a>
              </p>
            </div>

            {/* Credenciais de demonstração */}
            <div className="mt-4 p-3 rounded-lg text-xs text-center"
              style={{ background: 'rgba(56,178,172,0.06)', border: '1px solid rgba(56,178,172,0.15)', color: '#8B96A7' }}>
              💡 Use suas credenciais reais de <strong style={{ color: '#38B2AC' }}>cefis.com.br</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
