'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CefisCourse, CefisUser, OnboardingData, StudyPlan } from '@/lib/types'
import { GOALS, TIME_OPTIONS, LEVELS } from '@/lib/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`
  return `${m}min`
}

function CourseCard({ course }: { course: CefisCourse }) {
  return (
    <div className="card-hover p-4 rounded-xl"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: 'rgba(232,169,77,0.1)', color: '#E8A94D' }}>
          📚
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug mb-1" style={{ color: '#F2EDE6' }}>
            {course.title}
          </p>
          {course.teacher && (
            <p className="text-xs" style={{ color: '#8B96A7' }}>{course.teacher.name}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs" style={{ color: '#8B96A7' }}>
              ⏱ {formatDuration(course.duration)}
            </span>
            {course.averageRating && (
              <span className="text-xs" style={{ color: '#8B96A7' }}>
                ⭐ {course.averageRating.toFixed(1)}
              </span>
            )}
            {course.crcActive && (
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(56,178,172,0.1)', color: '#38B2AC', border: '1px solid rgba(56,178,172,0.2)' }}>
                CRC
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingPlan() {
  return (
    <div className="space-y-4">
      <div className="shimmer h-24 rounded-xl" />
      <div className="shimmer h-16 rounded-xl" />
      <div className="shimmer h-32 rounded-xl" />
      <div className="shimmer h-20 rounded-xl" />
    </div>
  )
}

function MarkdownText({ text }: { text: string }) {
  // Simple markdown: bold, italic, lists
  const lines = text.split('\n')
  return (
    <div className="prose-dark">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i}>{line.slice(4)}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i}><strong>{line.slice(2, -2)}</strong></p>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <ul key={i}>
              <li dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </ul>
          )
        }
        if (line.trim() === '') return <br key={i} />
        return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      })}
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
      const res = await fetch('/api/courses', {
        headers: { 'x-cefis-key': key },
      })
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
    setPlanError('')
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cefis-key': key },
        body: JSON.stringify({ onboarding: ob, courses: coursesData.slice(0, 20) }),
      })

      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan)

        // Add initial greeting
        const goalLabel = GOALS.find(g => g.id === ob.goal)?.label || ob.goal
        const greeting = `Olá${user ? `, ${user.first_name || user.name.split(' ')[0]}` : ''}! 👋\n\nAnalisei seu perfil e criei um plano de estudos personalizado para você. Seu objetivo é **${goalLabel}** nas áreas de **${ob.areas.join(', ')}**.\n\nJá montei seu plano à esquerda com os melhores cursos da CEFIS para o seu perfil. Pode me fazer qualquer pergunta — estou aqui para te ajudar em cada etapa!`
        setMessages([{ role: 'assistant', content: greeting }])
      } else {
        setPlanError('Erro ao gerar plano. Tente recarregar a página.')
      }
    } catch {
      setPlanError('Erro de conexão ao gerar plano.')
    }
    setPlanLoading(false)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }],
          onboarding,
          courses: courses.slice(0, 20),
          plan,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Chat error')

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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.'
      }])
    }
    setChatLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const goalLabel = GOALS.find(g => g.id === onboarding?.goal)?.label
  const timeLabel = TIME_OPTIONS.find(t => t.value === onboarding?.dailyMinutes)?.label
  const levelLabel = LEVELS.find(l => l.id === onboarding?.level)?.label

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 z-10"
        style={{ background: 'rgba(7,11,20,0.9)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E8A94D, #D4922B)' }}>
            <span className="text-black font-bold text-xs">C</span>
          </div>
          <span className="font-medium text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>
            Mentor CEFIS
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: 'var(--surface2)', color: '#E8A94D' }}>
                {user.first_name?.[0] || user.name[0]}
              </div>
            )}
            <span className="text-sm hidden md:block" style={{ color: '#8B96A7' }}>
              {user.first_name || user.name.split(' ')[0]}
            </span>
          </div>
        )}
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Study Plan */}
        <aside className={`flex-shrink-0 overflow-y-auto
          ${activeTab === 'plan' ? 'flex' : 'hidden'} lg:flex flex-col
          w-full lg:w-96 xl:w-[420px]`}
          style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>

          <div className="p-5 flex-1">
            {/* Profile summary */}
            {onboarding && (
              <div className="mb-5 p-4 rounded-xl"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-wide mb-2 font-medium" style={{ color: '#8B96A7' }}>
                  Seu Perfil
                </p>
                <div className="flex flex-wrap gap-2">
                  {onboarding.areas.map(a => (
                    <span key={a} className="text-xs px-2 py-1 rounded-full"
                      style={{ background: 'rgba(232,169,77,0.1)', color: '#E8A94D', border: '1px solid rgba(232,169,77,0.2)' }}>
                      {a}
                    </span>
                  ))}
                  {goalLabel && (
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: 'rgba(56,178,172,0.1)', color: '#38B2AC', border: '1px solid rgba(56,178,172,0.2)' }}>
                      🎯 {goalLabel}
                    </span>
                  )}
                  {timeLabel && (
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: 'var(--surface3)', color: '#8B96A7', border: '1px solid var(--border)' }}>
                      ⏱ {timeLabel}
                    </span>
                  )}
                  {levelLabel && (
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: 'var(--surface3)', color: '#8B96A7', border: '1px solid var(--border)' }}>
                      📊 {levelLabel}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                Seu Plano de Estudos
              </h2>
              {!planLoading && (
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'rgba(232,169,77,0.1)', color: '#E8A94D', border: '1px solid rgba(232,169,77,0.2)' }}>
                  ✨ Personalizado
                </span>
              )}
            </div>

            {planLoading && <LoadingPlan />}

            {planError && (
              <div className="p-4 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FC8181' }}>
                {planError}
              </div>
            )}

            {plan && !planLoading && (
              <div className="space-y-5">
                {/* Diagnosis */}
                <div className="p-4 rounded-xl"
                  style={{ background: 'rgba(232,169,77,0.05)', border: '1px solid rgba(232,169,77,0.15)' }}>
                  <p className="text-xs uppercase tracking-wide mb-2 font-medium" style={{ color: '#E8A94D' }}>
                    Diagnóstico
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#F2EDE6' }}>
                    {plan.diagnosis}
                  </p>
                </div>

                {/* Gaps */}
                {plan.gaps?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-2 font-medium" style={{ color: '#8B96A7' }}>
                      Lacunas identificadas
                    </p>
                    <div className="space-y-1.5">
                      {plan.gaps.map((g, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#F2EDE6' }}>
                          <span style={{ color: '#E8A94D', flexShrink: 0 }}>→</span>
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* First step highlight */}
                {plan.firstStep && (
                  <div className="p-4 rounded-xl"
                    style={{ background: 'rgba(56,178,172,0.06)', border: '1px solid rgba(56,178,172,0.2)' }}>
                    <p className="text-xs uppercase tracking-wide mb-1.5 font-medium" style={{ color: '#38B2AC' }}>
                      🚀 Comece agora
                    </p>
                    <p className="text-sm" style={{ color: '#F2EDE6' }}>{plan.firstStep}</p>
                  </div>
                )}

                {/* Weeks */}
                {plan.weeks?.map((w) => (
                  <div key={w.week}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ background: 'var(--surface3)', color: '#E8A94D' }}>
                        Semana {w.week}
                      </span>
                      <span className="text-xs" style={{ color: '#8B96A7' }}>{w.focus}</span>
                    </div>

                    <div className="space-y-2">
                      {w.courses.map((c) => {
                        const full = courses.find(cr => cr.id === c.id)
                        return (
                          <div key={c.id} className="p-3 rounded-xl"
                            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 text-base flex-shrink-0">📘</span>
                              <div>
                                <p className="text-sm font-medium" style={{ color: '#F2EDE6' }}>{c.title}</p>
                                {full && (
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs" style={{ color: '#8B96A7' }}>
                                      ⏱ {formatDuration(full.duration)}
                                    </span>
                                    {full.averageRating && (
                                      <span className="text-xs" style={{ color: '#8B96A7' }}>
                                        ⭐ {full.averageRating.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <p className="text-xs mt-1.5 italic" style={{ color: '#8B96A7' }}>{c.reason}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {w.tip && (
                      <p className="text-xs mt-2 pl-3" style={{ color: '#8B96A7', borderLeft: '2px solid var(--surface3)' }}>
                        💡 {w.tip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Redo onboarding */}
          <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { localStorage.removeItem('cefis_onboarding'); router.push('/onboarding') }}
              className="w-full text-xs py-2 rounded-lg transition-colors"
              style={{ color: '#8B96A7', border: '1px solid var(--border)', background: 'transparent' }}>
              ↻ Refazer onboarding
            </button>
          </div>
        </aside>

        {/* Right: Chat */}
        <main className={`flex-1 flex flex-col overflow-hidden
          ${activeTab === 'chat' ? 'flex' : 'hidden'} lg:flex`}>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && !planLoading && (
                <div className="text-center py-12 animate-fade-in">
                  <div className="text-4xl mb-3">🎓</div>
                  <p className="text-sm" style={{ color: '#8B96A7' }}>
                    Seu tutor está sendo preparado...
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3 mt-1"
                      style={{ background: 'linear-gradient(135deg, #E8A94D, #D4922B)', fontSize: '0.8rem' }}>
                      🎓
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 text-sm ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                    {msg.role === 'user' ? (
                      <p style={{ color: '#F2EDE6' }}>{msg.content}</p>
                    ) : (
                      <div className={msg.content === '' ? 'typing-cursor' : ''}>
                        {msg.content ? <MarkdownText text={msg.content} /> : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && !planLoading && (
            <div className="px-4 md:px-6 pb-3">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-2 flex-wrap">
                  {[
                    'Crie um resumo do meu plano de estudos',
                    'Tenho 10 minutos agora, me ensine algo',
                    'Quais são minhas principais lacunas?',
                    'Me faça um quiz sobre minha área',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 0) }}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        color: '#8B96A7',
                      }}
                      onMouseEnter={e => {
                        (e.target as HTMLElement).style.borderColor = 'rgba(232,169,77,0.3)'
                        ;(e.target as HTMLElement).style.color = '#E8A94D'
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLElement).style.borderColor = 'var(--border)'
                        ;(e.target as HTMLElement).style.color = '#8B96A7'
                      }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="flex-shrink-0 px-4 md:px-6 pb-5 pt-3"
            style={{ borderTop: '1px solid var(--border)' }}>
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-3 items-end p-3 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte qualquer coisa ao seu tutor..."
                  rows={1}
                  className="flex-1 resize-none text-sm bg-transparent outline-none"
                  style={{
                    color: '#F2EDE6',
                    lineHeight: '1.5',
                    maxHeight: '120px',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement
                    t.style.height = 'auto'
                    t.style.height = Math.min(t.scrollHeight, 120) + 'px'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || chatLoading}
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: input.trim() && !chatLoading
                      ? 'linear-gradient(135deg, #E8A94D, #D4922B)'
                      : 'var(--surface2)',
                    cursor: input.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                  }}>
                  {chatLoading ? (
                    <span className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'transparent', borderTopColor: '#E8A94D' }} />
                  ) : (
                    <span style={{ fontSize: '14px', color: input.trim() ? '#0a0a0a' : '#8B96A7' }}>↑</span>
                  )}
                </button>
              </div>
              <p className="text-center text-xs mt-2" style={{ color: '#2D3748' }}>
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <div className="lg:hidden flex-shrink-0 flex"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        {(['plan', 'chat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 text-sm font-medium transition-all"
            style={{
              color: activeTab === tab ? '#E8A94D' : '#8B96A7',
              borderBottom: activeTab === tab ? '2px solid #E8A94D' : '2px solid transparent',
            }}>
            {tab === 'plan' ? '📋 Plano' : '💬 Tutor'}
          </button>
        ))}
      </div>
    </div>
  )
}
