'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CefisCourse, CefisUser, OnboardingData, StudyPlan } from '@/lib/types'
import { GOALS, TIME_OPTIONS, LEVELS } from '@/lib/types'
import { AnimatedBg } from '@/components/AnimatedBg'
import { CustomCursor } from '@/components/CustomCursor'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`
  return `${m}min`
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function getCourseUrl(id: number, title?: string) {
  if (title) return `https://cefis.com.br/curso/${slugify(title)}/${id}`
  return `https://cefis.com.br/curso/${id}`
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="prose-dark">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <ul key={i}><li dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></ul>
        }
        if (line.trim() === '') return <br key={i} />
        return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      })}
    </div>
  )
}

function LoadingPlan() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[80, 60, 100, 70].map((w, i) => (
        <div key={i} className="shimmer" style={{ height: `${w}px`, borderRadius: '12px' }} />
      ))}
    </div>
  )
}

export default function TutorPage() {
  const router = useRouter()
  const [user, setUser] = useState<CefisUser | null>(null)
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [courses, setCourses] = useState<CefisCourse[]>([])
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [planError, setPlanError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'plan' | 'chat'>('plan')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const key = localStorage.getItem('cefis_key')
    if (!key) { router.push('/'); return }
    const u = JSON.parse(localStorage.getItem('cefis_user') || 'null')
    const ob = JSON.parse(localStorage.getItem('cefis_onboarding') || 'null')
    if (!ob) { router.push('/onboarding'); return }
    setUser(u)
    setOnboarding(ob)
    loadCourses(key, ob)
  }, [router])

  async function loadCourses(key: string, ob: OnboardingData) {
    try {
      const res = await fetch('/api/courses', { headers: { 'x-cefis-key': key } })
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
        generatePlan(ob, data.courses || [], key)
      } else {
        generatePlan(ob, [], key)
      }
    } catch {
      generatePlan(ob, [], key)
    }
  }

  async function generatePlan(ob: OnboardingData, coursesData: CefisCourse[], key: string) {
    setPlanLoading(true)
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cefis-key': key },
        body: JSON.stringify({ onboarding: ob, courses: coursesData.slice(0, 20) }),
      })
      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan)
        const goalLabel = GOALS.find(g => g.id === ob.goal)?.label || ob.goal
        const greeting = `Olá${user ? `, ${user.first_name || user.name?.split(' ')[0]}` : ''}! Seu plano de estudos está pronto.\n\nAnalisei seu perfil e selecionei os melhores cursos da CEFIS para o seu objetivo de **${goalLabel}** em **${ob.areas.join(', ')}**.\n\nVeja o plano ao lado e me chame se tiver dúvidas ou quiser praticar algum conteúdo.`
        setMessages([{ role: 'assistant', content: greeting }])
      } else {
        setPlanError('Erro ao gerar plano. Recarregue a página.')
      }
    } catch {
      setPlanError('Erro de conexão.')
    }
    setPlanLoading(false)
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!input.trim() || chatLoading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    setActiveTab('chat')

    try {
      const key = localStorage.getItem('cefis_key') || ''
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cefis-key': key },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMsg }], onboarding, courses: courses.slice(0, 20), plan }),
      })

      if (!res.ok || !res.body) throw new Error()

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiText = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        aiText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: aiText }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao processar. Tente novamente.' }])
    }
    setChatLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const goalLabel = GOALS.find(g => g.id === onboarding?.goal)?.label
  const timeLabel = TIME_OPTIONS.find(t => t.value === onboarding?.dailyMinutes)?.label
  const levelLabel = LEVELS.find(l => l.id === onboarding?.level)?.label

  const C = {
    header: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', height: '52px', position: 'relative' as const, zIndex: 10, borderBottom: '1px solid var(--border)', background: 'rgba(7,5,15,0.85)', backdropFilter: 'blur(12px)' },
    sidebar: { width: '380px', flexShrink: 0, overflowY: 'auto' as const, borderRight: '1px solid var(--border)', background: 'rgba(13,10,30,0.6)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column' as const },
    main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <AnimatedBg />
      <CustomCursor />

      {/* Header */}
      <header style={C.header} className="content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white' }}>C</div>
          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#F0EEFF', letterSpacing: '-0.01em' }}>Cepilot</span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)' }} />
              : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>{(user.first_name || user.name)?.[0]}</div>
            }
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }} className="hidden md:block">
              {user.first_name || user.name?.split(' ')[0]}
            </span>
          </div>
        )}
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }} className="content">

        {/* Sidebar: Study Plan */}
        <aside style={{ ...C.sidebar, display: activeTab === 'plan' ? 'flex' : 'none' }} className="lg-flex">
          <div style={{ padding: '1.25rem', flex: 1 }}>

            {/* Profile chips */}
            {onboarding && (
              <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '14px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.625rem' }}>Seu perfil</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {onboarding.areas.map(a => <span key={a} className="chip chip-violet">{a}</span>)}
                  {goalLabel && <span className="chip chip-blue">{goalLabel}</span>}
                  {timeLabel && <span className="chip chip-dim">{timeLabel}</span>}
                  {levelLabel && <span className="chip chip-dim">{levelLabel}</span>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#F0EEFF', letterSpacing: '-0.01em' }}>Plano de Estudos</h2>
              {!planLoading && <span className="chip chip-violet" style={{ fontSize: '0.65rem' }}>Personalizado</span>}
            </div>

            {planLoading && <LoadingPlan />}
            {planError && <div style={{ padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>{planError}</div>}

            {plan && !planLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Diagnosis */}
                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A78BFA', marginBottom: '0.5rem' }}>Diagnóstico</p>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#F0EEFF' }}>{plan.diagnosis}</p>
                </div>

                {/* Gaps */}
                {plan.gaps?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.625rem' }}>Lacunas identificadas</p>
                    {plan.gaps.map((g, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '0.375rem', fontSize: '0.85rem', color: '#F0EEFF' }}>
                        <span style={{ color: '#7C3AED', flexShrink: 0 }}>→</span>
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* First step */}
                {plan.firstStep && (
                  <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7DD3FC', marginBottom: '0.5rem' }}>Comece agora</p>
                    <p style={{ fontSize: '0.85rem', color: '#F0EEFF', lineHeight: '1.5' }}>{plan.firstStep}</p>
                  </div>
                )}

                {/* Weeks */}
                {plan.weeks?.map(w => (
                  <div key={w.week}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.625rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', background: 'var(--surface3)', color: '#A78BFA' }}>Semana {w.week}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{w.focus}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {w.courses.map(c => {
                        const full = courses.find(cr => cr.id === c.id)
                        return (
                          <a
                            key={c.id}
                            href={getCourseUrl(c.id, full?.title || c.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-hover
                            className="course-link"
                            style={{
                              display: 'block',
                              padding: '0.875rem 1rem',
                              borderRadius: '12px',
                              background: 'var(--surface2)',
                              border: '1px solid var(--border)',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.35)'
                              ;(e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                              ;(e.currentTarget as HTMLElement).style.background = 'var(--surface2)'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#F0EEFF', marginBottom: '4px', lineHeight: '1.3' }}>{c.title}</p>
                                {full && (
                                  <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDuration(full.duration)}</span>
                                    {full.averageRating && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{full.averageRating.toFixed(1)} / 5</span>}
                                    {full.crcActive && <span className="chip chip-blue" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>CRC</span>}
                                  </div>
                                )}
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: '1.4' }}>{c.reason}</p>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </div>
                          </a>
                        )
                      })}
                    </div>

                    {w.tip && (
                      <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', paddingLeft: '0.75rem', color: 'var(--muted)', borderLeft: '2px solid rgba(124,58,237,0.3)', lineHeight: '1.5' }}>
                        {w.tip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button onClick={() => { localStorage.removeItem('cefis_onboarding'); router.push('/onboarding') }}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--muted)', border: '1px solid var(--border)', background: 'transparent', transition: 'all 0.2s' }}
              data-hover>
              Refazer onboarding
            </button>
          </div>
        </aside>

        {/* Chat */}
        <main style={{ ...C.main, display: activeTab === 'chat' ? 'flex' : 'none' }} className="lg-flex-main">

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.25rem' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {messages.length === 0 && !planLoading && (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Preparando seu tutor...
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', flexShrink: 0, marginTop: '4px', fontSize: '13px', fontWeight: '700', color: 'white' }}>C</div>
                  )}
                  <div className={msg.role === 'user' ? 'msg-user' : 'msg-ai'} style={{ maxWidth: '78%', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                    {msg.role === 'user'
                      ? <p style={{ color: '#F0EEFF', lineHeight: '1.6' }}>{msg.content}</p>
                      : <div className={msg.content === '' ? 'typing-cursor' : ''}>{msg.content ? <MarkdownText text={msg.content} /> : null}</div>
                    }
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && !planLoading && (
            <div style={{ padding: '0 1.25rem 0.75rem' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  'Resumo do meu plano',
                  'Tenho 10 minutos — me ensina algo',
                  'Quais são minhas lacunas?',
                  'Crie um quiz para mim',
                ].map(q => (
                  <button key={q} onClick={() => setInput(q)} data-hover
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.875rem', borderRadius: '100px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.target as HTMLElement).style.color = '#A78BFA' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--muted)' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ flexShrink: 0, padding: '0.75rem 1.25rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', padding: '0.75rem', borderRadius: '14px', background: 'var(--surface2)', border: '1px solid var(--border)', transition: 'border-color 0.2s' }}
                onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
                onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte ao seu copiloto..."
                  rows={1}
                  style={{ flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none', color: '#F0EEFF', fontSize: '0.9rem', lineHeight: '1.5', maxHeight: '120px', fontFamily: 'Outfit, sans-serif' }}
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px' }}
                />
                <button onClick={sendMessage} disabled={!input.trim() || chatLoading} data-hover
                  style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', background: input.trim() && !chatLoading ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'var(--surface3)' }}>
                  {chatLoading
                    ? <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
                  }
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(123,116,148,0.5)', marginTop: '6px' }}>Enter para enviar · Shift+Enter para nova linha</p>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile tabs */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'rgba(13,10,30,0.9)', backdropFilter: 'blur(12px)', flexShrink: 0, position: 'relative', zIndex: 10 }} className="lg-hidden">
        {(['plan', 'chat'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} data-hover
            style={{ flex: 1, padding: '0.875rem', fontSize: '0.85rem', fontWeight: '500', background: 'transparent', border: 'none', color: activeTab === tab ? '#A78BFA' : 'var(--muted)', borderBottom: `2px solid ${activeTab === tab ? '#7C3AED' : 'transparent'}`, transition: 'all 0.2s' }}>
            {tab === 'plan' ? 'Plano' : 'Copiloto'}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (min-width: 1024px) {
          .lg-flex { display: flex !important; }
          .lg-flex-main { display: flex !important; }
          .lg-hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
