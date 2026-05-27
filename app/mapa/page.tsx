'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CefisCourse, OnboardingData } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import { AnimatedBg } from '@/components/AnimatedBg'
import { CustomCursor } from '@/components/CustomCursor'

interface Node {
  id: string
  label: string
  type: 'center' | 'area' | 'course'
  x: number
  y: number
  color: string
  courseId?: number
  courseTitle?: string
  duration?: number
  rating?: number
}

function slugify(title: string) {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`
  return `${m}min`
}

const AREA_COLORS: Record<string, string> = {
  'Contabilidade': '#7C3AED',
  'Fiscal / Tributário': '#38BDF8',
  'Trabalhista': '#10B981',
  'Direito': '#F59E0B',
  'Gestão': '#E879F9',
  'Desenvolvimento Pessoal': '#F97316',
  'Concursos Públicos': '#EF4444',
}

export default function MapaPage() {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [courses, setCourses] = useState<CefisCourse[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 })

  useEffect(() => {
    const key = localStorage.getItem('cefis_key')
    if (!key) { router.push('/'); return }
    const ob = JSON.parse(localStorage.getItem('cefis_onboarding') || 'null')
    if (!ob) { router.push('/onboarding'); return }
    setOnboarding(ob)

    const updateDims = () => {
      const w = Math.min(window.innerWidth - 32, 900)
      const h = Math.max(window.innerHeight - 180, 500)
      setDimensions({ w, h })
    }
    updateDims()
    window.addEventListener('resize', updateDims)

    fetchCourses(key, ob)
    return () => window.removeEventListener('resize', updateDims)
  }, [router])

  async function fetchCourses(key: string, ob: OnboardingData) {
    try {
      const res = await fetch('/api/courses', { headers: { 'x-cefis-key': key } })
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
        buildMap(ob, data.courses || [])
      } else {
        buildMap(ob, [])
      }
    } catch {
      buildMap(ob, [])
    }
    setLoading(false)
  }

  function buildMap(ob: OnboardingData, coursesData: CefisCourse[]) {
    const { w, h } = dimensions
    const cx = w / 2
    const cy = h / 2

    const newNodes: Node[] = []

    // Center node
    newNodes.push({ id: 'center', label: 'Você', type: 'center', x: cx, y: cy, color: '#7C3AED' })

    const areas = ob.areas || []
    const areaCount = areas.length
    const areaRadius = Math.min(w, h) * 0.28

    areas.forEach((area, i) => {
      const angle = (i / areaCount) * 2 * Math.PI - Math.PI / 2
      const ax = cx + areaRadius * Math.cos(angle)
      const ay = cy + areaRadius * Math.sin(angle)
      const color = AREA_COLORS[area] || '#7C3AED'

      newNodes.push({ id: `area-${i}`, label: area, type: 'area', x: ax, y: ay, color })

      // Find courses for this area
      const catId = CATEGORIES.find(c => c.label === area)?.id
      const areaCourses = catId
        ? coursesData.filter(c => c.categories?.includes(catId)).slice(0, 3)
        : coursesData.slice(i * 3, i * 3 + 3)

      const courseRadius = Math.min(w, h) * 0.15
      areaCourses.forEach((course, j) => {
        const spread = areaCount > 3 ? 0.5 : 0.7
        const courseAngle = angle + (j - (areaCourses.length - 1) / 2) * spread
        const cx2 = ax + courseRadius * Math.cos(courseAngle)
        const cy2 = ay + courseRadius * Math.sin(courseAngle)

        newNodes.push({
          id: `course-${course.id}`,
          label: course.title.length > 22 ? course.title.slice(0, 22) + '…' : course.title,
          type: 'course',
          x: Math.max(60, Math.min(w - 60, cx2)),
          y: Math.max(40, Math.min(h - 40, cy2)),
          color: `${color}99`,
          courseId: course.id,
          courseTitle: course.title,
          duration: course.duration,
          rating: course.averageRating,
        })
      })
    })

    setNodes(newNodes)
  }

  useEffect(() => {
    if (onboarding && courses.length >= 0 && !loading) {
      buildMap(onboarding, courses)
    }
  }, [dimensions])

  const areaNodes = nodes.filter(n => n.type === 'area')
  const courseNodes = nodes.filter(n => n.type === 'course')
  const centerNode = nodes.find(n => n.type === 'center')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AnimatedBg />
      <CustomCursor />

      {/* Header */}
      <header style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(7,5,15,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }} className="content">
        <button onClick={() => router.push('/dashboard')} data-hover style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0EEFF'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--muted)'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Dashboard
        </button>
        <span style={{ fontWeight: '700', fontSize: '0.9rem', background: 'linear-gradient(135deg, #38BDF8, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mapa de Conhecimento</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{courseNodes.length} cursos</span>
      </header>

      {/* Map */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }} className="content">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(56,189,248,0.2)', borderTopColor: '#38BDF8', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.9rem' }}>Construindo seu mapa...</p>
          </div>
        ) : (
          <div style={{ position: 'relative', width: dimensions.w, height: dimensions.h }}>
            <svg ref={svgRef} width={dimensions.w} height={dimensions.h} style={{ position: 'absolute', inset: 0 }}>
              <defs>
                {areaNodes.map(a => (
                  <radialGradient key={`grad-${a.id}`} id={`grad-${a.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={a.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={a.color} stopOpacity="0" />
                  </radialGradient>
                ))}
              </defs>

              {/* Center to area lines */}
              {centerNode && areaNodes.map(area => (
                <line key={`l-c-${area.id}`}
                  x1={centerNode.x} y1={centerNode.y}
                  x2={area.x} y2={area.y}
                  stroke={area.color} strokeWidth="1.5" strokeOpacity="0.3"
                  strokeDasharray="4 4">
                  <animate attributeName="strokeDashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite" />
                </line>
              ))}

              {/* Area to course lines */}
              {areaNodes.map(area =>
                courseNodes.filter(c => {
                  const areaIdx = parseInt(area.id.split('-')[1])
                  const areaName = onboarding?.areas?.[areaIdx]
                  const catId = CATEGORIES.find(ca => ca.label === areaName)?.id
                  const course = courses.find(cr => cr.id === c.courseId)
                  return course?.categories?.includes(catId || 0)
                }).map(course => (
                  <line key={`l-${area.id}-${course.id}`}
                    x1={area.x} y1={area.y}
                    x2={course.x} y2={course.y}
                    stroke={area.color} strokeWidth="1" strokeOpacity="0.2"
                  />
                ))
              )}

              {/* Area glow circles */}
              {areaNodes.map(area => (
                <circle key={`glow-${area.id}`}
                  cx={area.x} cy={area.y} r="60"
                  fill={`url(#grad-${area.id})`} />
              ))}

              {/* Course nodes */}
              {courseNodes.map(node => (
                <g key={node.id} style={{ cursor: 'none' }} onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}>
                  <circle cx={node.x} cy={node.y} r="22" fill="var(--surface2)" stroke={node.color} strokeWidth="1.5" strokeOpacity="0.6"
                    style={{ transition: 'r 0.2s, stroke-opacity 0.2s' }}
                    onMouseEnter={e => { (e.target as SVGCircleElement).setAttribute('r', '26'); (e.target as SVGCircleElement).setAttribute('stroke-opacity', '1') }}
                    onMouseLeave={e => { (e.target as SVGCircleElement).setAttribute('r', '22'); (e.target as SVGCircleElement).setAttribute('stroke-opacity', '0.6') }}
                  />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fill={node.color} fontSize="9" fontFamily="Outfit, sans-serif" fontWeight="500" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {node.label.split(' ').slice(0, 2).join(' ')}
                  </text>
                </g>
              ))}

              {/* Area nodes */}
              {areaNodes.map(node => (
                <g key={node.id} onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)} style={{ cursor: 'none' }}>
                  <circle cx={node.x} cy={node.y} r="38" fill="var(--surface)" stroke={node.color} strokeWidth="2"
                    style={{ filter: `drop-shadow(0 0 8px ${node.color}40)` }} />
                  <circle cx={node.x} cy={node.y} r="38" fill="transparent" stroke={node.color} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 4">
                    <animateTransform attributeName="transform" type="rotate" from={`0 ${node.x} ${node.y}`} to={`360 ${node.x} ${node.y}`} dur="20s" repeatCount="indefinite" />
                  </circle>
                  <text x={node.x} y={node.y - 4} textAnchor="middle" fill={node.color} fontSize="10" fontFamily="Outfit, sans-serif" fontWeight="700" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {node.label.split('/')[0].trim()}
                  </text>
                  {node.label.includes('/') && (
                    <text x={node.x} y={node.y + 9} textAnchor="middle" fill={node.color} fontSize="9" fontFamily="Outfit, sans-serif" fontWeight="500" fillOpacity="0.7" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {node.label.split('/')[1].trim()}
                    </text>
                  )}
                </g>
              ))}

              {/* Center node */}
              {centerNode && (
                <g>
                  <circle cx={centerNode.x} cy={centerNode.y} r="48" fill="var(--surface)" stroke="#7C3AED" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 16px rgba(124,58,237,0.4))' }} />
                  <circle cx={centerNode.x} cy={centerNode.y} r="48" fill="transparent" stroke="url(#centerGrad)" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="6 3">
                    <animateTransform attributeName="transform" type="rotate" from={`0 ${centerNode.x} ${centerNode.y}`} to={`-360 ${centerNode.x} ${centerNode.y}`} dur="12s" repeatCount="indefinite" />
                  </circle>
                  <defs>
                    <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <text x={centerNode.x} y={centerNode.y + 5} textAnchor="middle" fill="white" fontSize="13" fontFamily="Outfit, sans-serif" fontWeight="700" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    Você
                  </text>
                </g>
              )}
            </svg>

            {/* Selected node panel */}
            {selectedNode && (
              <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem 1.5rem', maxWidth: '420px', width: 'calc(100% - 2rem)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                className="fade-in">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: selectedNode.color, marginBottom: '0.25rem' }}>
                      {selectedNode.type === 'area' ? 'Área' : 'Curso'}
                    </p>
                    <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#F0EEFF', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                      {selectedNode.type === 'course' ? selectedNode.courseTitle : selectedNode.label}
                    </p>
                    {selectedNode.type === 'course' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {selectedNode.duration && <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{formatDuration(selectedNode.duration)}</span>}
                        {selectedNode.rating && <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{selectedNode.rating.toFixed(1)} / 5</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {selectedNode.type === 'course' && selectedNode.courseId && (
                      <a href={`https://cefis.com.br/curso/${slugify(selectedNode.courseTitle || '')}//${selectedNode.courseId}`}
                        target="_blank" rel="noopener noreferrer" data-hover
                        className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Ver curso
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      </a>
                    )}
                    <button onClick={() => setSelectedNode(null)} data-hover
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>
    </div>
  )
}
