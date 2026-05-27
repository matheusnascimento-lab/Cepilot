'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CefisUser, OnboardingData } from '@/lib/types'
import { GOALS, TIME_OPTIONS, LEVELS } from '@/lib/types'
import { AnimatedBg } from '@/components/AnimatedBg'
import { CustomCursor } from '@/components/CustomCursor'

interface NavCard {
  id: string
  title: string
  desc: string
  path: string
  gradient: string
  icon: React.ReactNode
  tag?: string
}

function Icon({ d, size = 24 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<CefisUser | null>(null)
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [battleBest, setBattleBest] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const key = localStorage.getItem('cefis_key')
    if (!key) { router.push('/'); return }
    const u = JSON.parse(localStorage.getItem('cefis_user') || 'null')
    const ob = JSON.parse(localStorage.getItem('cefis_onboarding') || 'null')
    if (!ob) { router.push('/onboarding'); return }
    const best = localStorage.getItem('battle_best')
    setUser(u)
    setOnboarding(ob)
    if (best) setBattleBest(parseInt(best))
    setMounted(true)
  }, [router])

  function logout() {
    localStorage.removeItem('cefis_key')
    localStorage.removeItem('cefis_user')
    localStorage.removeItem('cefis_onboarding')
    router.push('/')
  }

  const goalLabel = GOALS.find(g => g.id === onboarding?.goal)?.label
  const timeLabel = TIME_OPTIONS.find(t => t.value === onboarding?.dailyMinutes)?.label
  const levelLabel = LEVELS.find(l => l.id === onboarding?.level)?.label
  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'aluno'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const cards: NavCard[] = [
    {
      id: 'tutor',
      title: 'Tutor + Plano',
      desc: 'Converse com seu copiloto e veja seu plano de estudos personalizado com cursos reais da CEFIS.',
      path: '/tutor',
      gradient: 'linear-gradient(135deg, #7C3AED22, #7C3AED08)',
      tag: 'IA',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'mapa',
      title: 'Mapa de Conhecimento',
      desc: 'Visualize sua jornada de aprendizado como um mapa interativo. Explore áreas e cursos conectados.',
      path: '/mapa',
      gradient: 'linear-gradient(135deg, #38BDF822, #38BDF808)',
      tag: 'Visual',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7DD3FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <circle cx="4" cy="6" r="2" />
          <circle cx="20" cy="6" r="2" />
          <circle cx="4" cy="18" r="2" />
          <circle cx="20" cy="18" r="2" />
          <line x1="6" y1="6" x2="9" y2="11" />
          <line x1="18" y1="6" x2="15" y2="11" />
          <line x1="6" y1="18" x2="9" y2="13" />
          <line x1="18" y1="18" x2="15" y2="13" />
        </svg>
      ),
    },
    {
      id: 'batalha',
      title: 'Modo Batalha',
      desc: 'Desafie a IA em um quiz cronometrado. Teste seus conhecimentos e veja quem sabe mais.',
      path: '/batalha',
      gradient: 'linear-gradient(135deg, #D946EF22, #D946EF08)',
      tag: battleBest !== null ? `Recorde: ${battleBest}/5` : 'Novo',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E879F9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
  ]

  const S = {
    page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, position: 'relative' as const },
    header: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(7,5,15,0.8)', backdropFilter: 'blur(12px)', position: 'sticky' as const, top: 0, zIndex: 10 },
    body: { flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' },
  }

  if (!mounted) return null

  return (
    <div style={S.page}>
      <AnimatedBg />
      <CustomCursor />

      {/* Header */}
      <header style={S.header} className="content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>C</div>
          <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em' }}>Cepilot</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--border)' }} />
            : <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>{firstName[0].toUpperCase()}</div>
          }
          <button onClick={logout} data-hover style={{ fontSize: '0.78rem', color: 'var(--muted)', background: 'transparent', border: 'none', padding: '4px 8px', borderRadius: '6px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#F0EEFF'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--muted)'}>
            Sair
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={S.body} className="content">

        {/* Welcome */}
        <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{greeting},</p>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '1rem' }}>
            {firstName}<span className="gradient-text">.</span>
          </h1>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {onboarding?.areas?.map(a => (
              <span key={a} className="chip chip-violet">{a}</span>
            ))}
            {goalLabel && <span className="chip chip-blue">{goalLabel}</span>}
            {timeLabel && <span className="chip chip-dim">{timeLabel}</span>}
            {levelLabel && <span className="chip chip-dim">{levelLabel}</span>}
            <button onClick={() => { localStorage.removeItem('cefis_onboarding'); router.push('/onboarding') }}
              data-hover className="chip chip-dim" style={{ background: 'transparent', border: '1px dashed rgba(123,116,148,0.3)', cursor: 'pointer', transition: 'all 0.2s' }}>
              + editar perfil
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {cards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => router.push(card.path)}
              data-hover
              className={`fade-up delay-${i + 1}`}
              style={{
                background: card.gradient,
                border: '1px solid var(--border)',
                borderRadius: '18px',
                padding: '1.75rem',
                textAlign: 'left',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'none',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.transform = 'translateY(-4px)'
                el.style.borderColor = 'rgba(124,58,237,0.4)'
                el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.transform = 'translateY(0)'
                el.style.borderColor = 'var(--border)'
                el.style.boxShadow = 'none'
              }}>

              {/* Glow */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', borderRadius: '50%', background: card.gradient, filter: 'blur(40px)', opacity: 0.4, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {card.icon}
                </div>
                {card.tag && (
                  <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '3px 10px', borderRadius: '100px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)' }}>
                    {card.tag}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F0EEFF', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{card.title}</h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: '1.6' }}>{card.desc}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                <span>Acessar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Quick tip */}
        <div className="fade-up delay-4" style={{ padding: '1rem 1.25rem', borderRadius: '14px', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: '1.5' }}>
            Dica: Comece pelo <strong style={{ color: '#7DD3FC' }}>Tutor + Plano</strong> para ver seus cursos recomendados da CEFIS, depois teste seus conhecimentos no <strong style={{ color: '#E879F9' }}>Modo Batalha</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
