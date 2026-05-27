'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, GOALS, TIME_OPTIONS, LEVELS, LEARNING_STYLES } from '@/lib/types'
import type { OnboardingData } from '@/lib/types'

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [userName, setUserName] = useState('você')
  const [data, setData] = useState<Partial<OnboardingData>>({
    areas: [],
  })

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
        areas: areas.includes(label)
          ? areas.filter(a => a !== label)
          : [...areas, label],
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
    router.push('/tutor')
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8A94D, #D4922B)' }}>
              <span className="text-black font-bold text-xs">C</span>
            </div>
            <span className="text-sm font-medium" style={{ color: '#8B96A7' }}>Mentor CEFIS</span>
          </div>
          <span className="text-xs" style={{ color: '#8B96A7' }}>
            Etapa {step} de {TOTAL_STEPS}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-2xl p-8 md:p-10"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Step 1: Areas */}
        {step === 1 && (
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#E8A94D' }}>Personalização</p>
            <h2 className="text-3xl font-medium mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Olá, {userName}! Que área te interessa?
            </h2>
            <p className="text-sm mb-8" style={{ color: '#8B96A7' }}>
              Selecione uma ou mais áreas — seu tutor vai focar no que importa para você.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const selected = data.areas?.includes(cat.label)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleArea(cat.label)}
                    className="card-hover flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? 'rgba(232,169,77,0.12)' : 'var(--surface2)',
                      border: selected ? '1px solid rgba(232,169,77,0.4)' : '1px solid var(--border)',
                    }}>
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium" style={{ color: selected ? '#E8A94D' : '#F2EDE6' }}>
                      {cat.label}
                    </span>
                    {selected && (
                      <span className="ml-auto text-xs" style={{ color: '#E8A94D' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#E8A94D' }}>Objetivo</p>
            <h2 className="text-3xl font-medium mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Qual é sua meta?
            </h2>
            <p className="text-sm mb-8" style={{ color: '#8B96A7' }}>
              Isso vai guiar as recomendações e o ritmo do seu plano.
            </p>
            <div className="space-y-3">
              {GOALS.map((g) => {
                const selected = data.goal === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => setData(prev => ({ ...prev, goal: g.id }))}
                    className="card-hover w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? 'rgba(232,169,77,0.12)' : 'var(--surface2)',
                      border: selected ? '1px solid rgba(232,169,77,0.4)' : '1px solid var(--border)',
                    }}>
                    <span className="text-2xl">{g.icon}</span>
                    <span className="text-sm font-medium" style={{ color: selected ? '#E8A94D' : '#F2EDE6' }}>
                      {g.label}
                    </span>
                    {selected && <span className="ml-auto text-xs" style={{ color: '#E8A94D' }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Time */}
        {step === 3 && (
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#E8A94D' }}>Disponibilidade</p>
            <h2 className="text-3xl font-medium mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Quanto tempo você tem por dia?
            </h2>
            <p className="text-sm mb-8" style={{ color: '#8B96A7' }}>
              Não importa quanto — seu tutor vai otimizar cada minuto.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {TIME_OPTIONS.map((t) => {
                const selected = data.dailyMinutes === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setData(prev => ({ ...prev, dailyMinutes: t.value }))}
                    className="card-hover p-5 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? 'rgba(232,169,77,0.12)' : 'var(--surface2)',
                      border: selected ? '1px solid rgba(232,169,77,0.4)' : '1px solid var(--border)',
                    }}>
                    <div className="text-xl font-semibold mb-1"
                      style={{ fontFamily: 'Playfair Display, serif', color: selected ? '#E8A94D' : '#F2EDE6' }}>
                      {t.label}
                    </div>
                    <div className="text-xs" style={{ color: '#8B96A7' }}>{t.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Level + Style */}
        {step === 4 && (
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#E8A94D' }}>Perfil de Aprendizado</p>
            <h2 className="text-3xl font-medium mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Como você aprende?
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8B96A7' }}>
              Vamos ajustar o conteúdo ao seu estilo único.
            </p>

            {/* Level */}
            <p className="text-xs uppercase tracking-wide mb-3 font-medium" style={{ color: '#8B96A7' }}>
              Nível atual na área escolhida
            </p>
            <div className="space-y-2 mb-8">
              {LEVELS.map((lv) => {
                const selected = data.level === lv.id
                return (
                  <button
                    key={lv.id}
                    onClick={() => setData(prev => ({ ...prev, level: lv.id }))}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                    style={{
                      background: selected ? 'rgba(232,169,77,0.1)' : 'transparent',
                      border: selected ? '1px solid rgba(232,169,77,0.3)' : '1px solid transparent',
                    }}>
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: selected ? '#E8A94D' : '#2D3748' }}>
                      {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#E8A94D' }} />}
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: selected ? '#E8A94D' : '#F2EDE6' }}>
                        {lv.label}
                      </span>
                      <span className="text-xs ml-2" style={{ color: '#8B96A7' }}>{lv.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Learning style */}
            <p className="text-xs uppercase tracking-wide mb-3 font-medium" style={{ color: '#8B96A7' }}>
              Estilo de aprendizagem
            </p>
            <div className="grid grid-cols-2 gap-3">
              {LEARNING_STYLES.map((ls) => {
                const selected = data.learningStyle === ls.id
                return (
                  <button
                    key={ls.id}
                    onClick={() => setData(prev => ({ ...prev, learningStyle: ls.id }))}
                    className="card-hover p-4 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? 'rgba(56,178,172,0.1)' : 'var(--surface2)',
                      border: selected ? '1px solid rgba(56,178,172,0.4)' : '1px solid var(--border)',
                    }}>
                    <div className="text-xl mb-1">{ls.icon}</div>
                    <div className="text-sm font-medium mb-0.5" style={{ color: selected ? '#38B2AC' : '#F2EDE6' }}>
                      {ls.label}
                    </div>
                    <div className="text-xs" style={{ color: '#8B96A7', lineHeight: '1.4' }}>{ls.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="btn-secondary"
            style={{ opacity: step === 1 ? 0 : 1, pointerEvents: step === 1 ? 'none' : 'auto' }}>
            ← Voltar
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="btn-primary">
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canAdvance()}
              className="btn-primary flex items-center gap-2">
              <span>Criar meu plano</span>
              <span>✨</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
