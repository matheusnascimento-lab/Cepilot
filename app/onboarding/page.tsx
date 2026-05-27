'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, GOALS, TIME_OPTIONS, LEVELS, LEARNING_STYLES } from '@/lib/types'
import type { OnboardingData } from '@/lib/types'
import { AnimatedBg } from '@/components/AnimatedBg'
import { CustomCursor } from '@/components/CustomCursor'

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [userName, setUserName] = useState('você')
  const [data, setData] = useState<Partial<OnboardingData>>({ areas: [] })

  useEffect(() => {
    const key = localStorage.getItem('cefis_key')
    if (!key) { router.push('/'); return }
    const user = JSON.parse(localStorage.getItem('cefis_user') || '{}')
    if (user?.first_name) setUserName(user.first_name)
  }, [router])

  function toggleArea(label: string) {
    setData(prev => {
      const areas = prev.areas || []
      return {
        ...prev,
        areas: areas.includes(label) ? areas.filter(a => a !== label) : [...areas, label],
      }
    })
  }

  function canAdvance() {
    if (step === 1) return (data.areas?.length || 0) > 0
    if (step === 2) return !!data.goal
    if (step === 3) return !!data.dailyMinutes
    if (step === 4) return !!data.level && !!data.learningStyle
    return false
  }

  function handleFinish() {
    localStorage.setItem('cefis_onboarding', JSON.stringify(data))
    router.push('/dashboard')
  }

  const progress = (step / TOTAL_STEPS) * 100

  const S = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative' as const },
    header: { width: '100%', maxWidth: '640px', marginBottom: '1.5rem' },
    card: { width: '100%', maxWidth: '640px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem' },
    label: { fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#A78BFA', marginBottom: '0.5rem', display: 'block' },
    title: { fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#F0EEFF', marginBottom: '0.5rem', lineHeight: '1.25' },
    sub: { fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '2rem', lineHeight: '1.6' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
    nav: { display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' },
  }

  function OptionBtn({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <button
        onClick={onClick}
        data-hover
        style={{
          background: selected ? 'rgba(124,58,237,0.12)' : 'var(--surface2)',
          border: `1px solid ${selected ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'left',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}>
        {selected && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.05), transparent)',
            pointerEvents: 'none',
          }} />
        )}
        {children}
      </button>
    )
  }

  return (
    <div style={S.container}>
      <AnimatedBg />
      <CustomCursor />

      <div className="content" style={{ width: '100%', maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white' }}>C</div>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--muted)' }}>Cepilot</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Etapa {step} / {TOTAL_STEPS}</span>
        </div>

        <div className="progress-bar" style={{ marginBottom: '1.5rem' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Card */}
        <div className="card fade-up" style={{ padding: '2.5rem' }}>

          {/* Step 1 */}
          {step === 1 && (
            <>
              <span style={S.label}>Personalização</span>
              <h2 style={S.title}>Olá, {userName}! Qual área te interessa?</h2>
              <p style={S.sub}>Escolha uma ou mais — seu copiloto vai focar no que importa para você.</p>
              <div style={S.grid2}>
                {CATEGORIES.map(cat => {
                  const sel = data.areas?.includes(cat.label)
                  return (
                    <OptionBtn key={cat.id} selected={!!sel} onClick={() => toggleArea(cat.label)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: sel ? '#A78BFA' : '#F0EEFF' }}>{cat.label}</span>
                        </div>
                        {sel && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', flexShrink: 0 }}>✓</div>}
                      </div>
                    </OptionBtn>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <span style={S.label}>Objetivo</span>
              <h2 style={S.title}>Qual é sua meta?</h2>
              <p style={S.sub}>Isso define a direção do seu plano de estudos.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {GOALS.map(g => {
                  const sel = data.goal === g.id
                  return (
                    <OptionBtn key={g.id} selected={sel} onClick={() => setData(p => ({ ...p, goal: g.id }))}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{g.icon}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: sel ? '#A78BFA' : '#F0EEFF' }}>{g.label}</span>
                        {sel && <div style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white' }}>✓</div>}
                      </div>
                    </OptionBtn>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <span style={S.label}>Disponibilidade</span>
              <h2 style={S.title}>Quanto tempo por dia?</h2>
              <p style={S.sub}>Cada minuto conta — o Cepilot vai otimizar cada um deles.</p>
              <div style={S.grid2}>
                {TIME_OPTIONS.map(t => {
                  const sel = data.dailyMinutes === t.value
                  return (
                    <OptionBtn key={t.value} selected={sel} onClick={() => setData(p => ({ ...p, dailyMinutes: t.value }))}>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.02em', color: sel ? '#A78BFA' : '#F0EEFF', marginBottom: '4px' }}>{t.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.desc}</div>
                    </OptionBtn>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <>
              <span style={S.label}>Perfil de aprendizado</span>
              <h2 style={S.title}>Como você aprende?</h2>
              <p style={S.sub}>Vamos ajustar o conteúdo ao seu estilo.</p>

              <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.75rem' }}>Nível atual</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {LEVELS.map(lv => {
                  const sel = data.level === lv.id
                  return (
                    <button key={lv.id} onClick={() => setData(p => ({ ...p, level: lv.id }))} data-hover
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', borderRadius: '10px', textAlign: 'left', background: sel ? 'rgba(124,58,237,0.08)' : 'transparent', border: `1px solid ${sel ? 'rgba(124,58,237,0.3)' : 'transparent'}`, transition: 'all 0.2s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${sel ? '#7C3AED' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7C3AED' }} />}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: sel ? '#A78BFA' : '#F0EEFF' }}>{lv.label}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{lv.desc}</span>
                    </button>
                  )
                })}
              </div>

              <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.75rem' }}>Estilo de aprendizagem</p>
              <div style={S.grid2}>
                {LEARNING_STYLES.map(ls => {
                  const sel = data.learningStyle === ls.id
                  return (
                    <OptionBtn key={ls.id} selected={sel} onClick={() => setData(p => ({ ...p, learningStyle: ls.id }))}>
                      <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{ls.icon}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: sel ? '#7DD3FC' : '#F0EEFF', marginBottom: '2px' }}>{ls.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: '1.4' }}>{ls.desc}</div>
                    </OptionBtn>
                  )
                })}
              </div>
            </>
          )}

          {/* Nav */}
          <div style={S.nav}>
            <button onClick={() => setStep(s => s - 1)} disabled={step === 1} className="btn-secondary" style={{ opacity: step === 1 ? 0 : 1, pointerEvents: step === 1 ? 'none' : 'auto' }}>
              Voltar
            </button>
            {step < TOTAL_STEPS ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} className="btn-primary">
                Continuar
              </button>
            ) : (
              <button onClick={handleFinish} disabled={!canAdvance()} className="btn-primary">
                Criar meu plano
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
