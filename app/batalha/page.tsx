'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { OnboardingData } from '@/lib/types'
import { GOALS, LEVELS } from '@/lib/types'
import { AnimatedBg } from '@/components/AnimatedBg'
import { CustomCursor } from '@/components/CustomCursor'

interface Question {
  question: string
  options: string[]
  correct: number
  explanation: string
}

type GameState = 'loading' | 'ready' | 'playing' | 'answered' | 'finished'

const TIMER_SECONDS = 25
const TOTAL_QUESTIONS = 5

export default function BatalhaPage() {
  const router = useRouter()
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [gameState, setGameState] = useState<GameState>('loading')
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [timer, setTimer] = useState(TIMER_SECONDS)
  const [timeouts, setTimeouts] = useState(0)
  const [results, setResults] = useState<{ correct: boolean; timeout: boolean }[]>([])
  const [bestScore, setBestScore] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const key = localStorage.getItem('cefis_key')
    if (!key) { router.push('/'); return }
    const ob = JSON.parse(localStorage.getItem('cefis_onboarding') || 'null')
    if (!ob) { router.push('/onboarding'); return }
    const best = localStorage.getItem('battle_best')
    if (best) setBestScore(parseInt(best))
    setOnboarding(ob)
    loadQuestions(ob)
  }, [router])

  async function loadQuestions(ob: OnboardingData) {
    setGameState('loading')
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas: ob.areas,
          level: LEVELS.find(l => l.id === ob.level)?.label || ob.level,
          goal: GOALS.find(g => g.id === ob.goal)?.label || ob.goal,
        }),
      })
      const data = await res.json()
      if (data.questions?.length > 0) {
        setQuestions(data.questions)
        setGameState('ready')
      } else {
        setGameState('ready')
      }
    } catch {
      setGameState('ready')
    }
  }

  const handleTimeout = useCallback(() => {
    if (gameState !== 'playing') return
    setTimeouts(t => t + 1)
    setResults(r => [...r, { correct: false, timeout: true }])

    // AI has higher chance of answering in time
    const aiCorrect = Math.random() > 0.3
    if (aiCorrect) setAiScore(s => s + 1)

    setSelected(-1) // timeout indicator
    setGameState('answered')

    setTimeout(() => {
      if (currentQ + 1 >= TOTAL_QUESTIONS) {
        setGameState('finished')
      } else {
        setCurrentQ(q => q + 1)
        setSelected(null)
        setTimer(TIMER_SECONDS)
        setGameState('playing')
      }
    }, 2000)
  }, [gameState, currentQ])

  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState, handleTimeout])

  function startGame() {
    setCurrentQ(0)
    setPlayerScore(0)
    setAiScore(0)
    setTimeouts(0)
    setResults([])
    setSelected(null)
    setTimer(TIMER_SECONDS)
    setGameState('playing')
  }

  function handleAnswer(idx: number) {
    if (gameState !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)

    setSelected(idx)
    setGameState('answered')

    const q = questions[currentQ]
    const correct = idx === q.correct
    if (correct) setPlayerScore(s => s + 1)
    setResults(r => [...r, { correct, timeout: false }])

    // AI answers — slightly worse than user
    const aiCorrect = Math.random() > 0.45
    if (aiCorrect) setAiScore(s => s + 1)

    setTimeout(() => {
      if (currentQ + 1 >= TOTAL_QUESTIONS) {
        const finalScore = correct ? playerScore + 1 : playerScore
        const best = parseInt(localStorage.getItem('battle_best') || '0')
        if (finalScore > best) {
          localStorage.setItem('battle_best', String(finalScore))
          setBestScore(finalScore)
        }
        setGameState('finished')
      } else {
        setCurrentQ(q => q + 1)
        setSelected(null)
        setTimer(TIMER_SECONDS)
        setGameState('playing')
      }
    }, 2200)
  }

  function restart() {
    if (onboarding) loadQuestions(onboarding)
    setGameState('loading')
    setCurrentQ(0)
    setPlayerScore(0)
    setAiScore(0)
    setTimeouts(0)
    setResults([])
    setSelected(null)
    setTimer(TIMER_SECONDS)
  }

  const q = questions[currentQ]
  const timerPct = (timer / TIMER_SECONDS) * 100
  const timerColor = timer > 15 ? '#7C3AED' : timer > 8 ? '#F59E0B' : '#EF4444'

  const S = {
    page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, position: 'relative' as const },
    header: { height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(7,5,15,0.8)', backdropFilter: 'blur(12px)', position: 'sticky' as const, top: 0, zIndex: 10 },
    body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
    card: { width: '100%', maxWidth: '640px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', position: 'relative' as const, overflow: 'hidden' as const },
  }

  return (
    <div style={S.page}>
      <AnimatedBg />
      <CustomCursor />

      <header style={S.header} className="content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => router.push('/dashboard')} data-hover style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0EEFF'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--muted)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Dashboard
          </button>
        </div>
        <span style={{ fontWeight: '700', fontSize: '0.9rem', background: 'linear-gradient(135deg, #D946EF, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modo Batalha</span>
        {bestScore !== null && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Recorde: {bestScore}/5</span>}
        {bestScore === null && <div style={{ width: '60px' }} />}
      </header>

      <div style={S.body} className="content">

        {/* LOADING */}
        {gameState === 'loading' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid rgba(217,70,239,0.2)', borderTopColor: '#D946EF', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Gerando questões com IA...</p>
          </div>
        )}

        {/* READY */}
        {gameState === 'ready' && (
          <div style={{ ...S.card, textAlign: 'center' }} className="fade-in">
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #D946EF22, #7C3AED22)', border: '1px solid rgba(217,70,239,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E879F9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Modo Batalha</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              5 questões · {TIMER_SECONDS}s por pergunta · Você vs IA<br />
              Área: <strong style={{ color: '#A78BFA' }}>{onboarding?.areas?.join(', ')}</strong>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
              {[
                { label: 'Questões', value: '5' },
                { label: 'Tempo', value: `${TIMER_SECONDS}s` },
                { label: 'Adversário', value: 'IA' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '0.875rem 1.25rem', borderRadius: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', minWidth: '80px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F0EEFF' }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={startGame} className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #D946EF, #7C3AED)' }}>
              Iniciar Batalha
            </button>
          </div>
        )}

        {/* PLAYING / ANSWERED */}
        {(gameState === 'playing' || gameState === 'answered') && q && (
          <div style={S.card} className="fade-in">
            {/* Score header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#A78BFA' }}>{playerScore}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Você</div>
              </div>
              <div style={{ flex: 1, margin: '0 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{currentQ + 1}/{TOTAL_QUESTIONS}</span>
                  <span style={{ fontSize: '0.75rem', color: timerColor, fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{timer}s</span>
                </div>
                <div style={{ height: '4px', background: 'var(--surface3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: '4px', transition: 'width 1s linear, background 0.3s' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#E879F9' }}>{aiScore}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>IA</div>
              </div>
            </div>

            {/* Question */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.75rem', display: 'block' }}>
                Questão {currentQ + 1}
              </span>
              <p style={{ fontSize: '1rem', fontWeight: '500', color: '#F0EEFF', lineHeight: '1.6' }}>{q.question}</p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
              {q.options.map((opt, idx) => {
                let bg = 'var(--surface2)'
                let border = 'var(--border)'
                let color = '#F0EEFF'

                if (gameState === 'answered') {
                  if (idx === q.correct) { bg = 'rgba(34,197,94,0.1)'; border = 'rgba(34,197,94,0.4)'; color = '#86EFAC' }
                  else if (idx === selected && selected !== q.correct) { bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.3)'; color = '#FCA5A5' }
                }

                return (
                  <button key={idx} onClick={() => handleAnswer(idx)}
                    disabled={gameState !== 'playing'}
                    data-hover={gameState === 'playing' ? '' : undefined}
                    style={{ padding: '0.875rem 1rem', borderRadius: '10px', background: bg, border: `1px solid ${border}`, color, fontSize: '0.875rem', textAlign: 'left', transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif' }}
                    onMouseEnter={e => { if (gameState === 'playing') { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)' } }}
                    onMouseLeave={e => { if (gameState === 'playing') { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' } }}>
                    {opt}
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {gameState === 'answered' && selected !== -1 && (
              <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', fontSize: '0.83rem', color: 'var(--muted)', lineHeight: '1.6' }} className="fade-in">
                <strong style={{ color: '#A78BFA' }}>Explicação: </strong>{q.explanation}
              </div>
            )}

            {gameState === 'answered' && selected === -1 && (
              <div style={{ padding: '0.875rem', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.83rem', color: '#FCD34D', textAlign: 'center' }} className="fade-in">
                Tempo esgotado!
              </div>
            )}
          </div>
        )}

        {/* FINISHED */}
        {gameState === 'finished' && (
          <div style={{ ...S.card, textAlign: 'center' }} className="fade-in">
            <div style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
              {playerScore > aiScore
                ? <span className="gradient-text">Você venceu!</span>
                : playerScore === aiScore
                ? <span style={{ color: '#F0EEFF' }}>Empate!</span>
                : <span style={{ color: '#E879F9' }}>IA venceu</span>
              }
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
              <div style={{ textAlign: 'center', padding: '1.5rem 2rem', borderRadius: '16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#A78BFA' }}>{playerScore}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Você</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>vs</div>
              <div style={{ textAlign: 'center', padding: '1.5rem 2rem', borderRadius: '16px', background: 'rgba(217,70,239,0.08)', border: '1px solid rgba(217,70,239,0.2)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#E879F9' }}>{aiScore}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>IA</div>
              </div>
            </div>

            {/* Q results */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '2rem' }}>
              {results.map((r, i) => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: r.timeout ? 'rgba(245,158,11,0.15)' : r.correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', border: `1px solid ${r.timeout ? 'rgba(245,158,11,0.3)' : r.correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}` }}>
                  {r.timeout ? '⏱' : r.correct ? '✓' : '✗'}
                </div>
              ))}
            </div>

            {bestScore === playerScore && playerScore > 0 && (
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#7DD3FC' }}>
                Novo recorde pessoal!
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={restart} className="btn-primary" style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, #D946EF, #7C3AED)' }}>
                Jogar novamente
              </button>
              <button onClick={() => router.push('/dashboard')} className="btn-secondary" style={{ flex: 1, padding: '0.875rem' }}>
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>
    </div>
  )
}
