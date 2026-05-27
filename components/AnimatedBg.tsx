'use client'

import { useEffect, useRef } from 'react'

export function AnimatedBg() {
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight

      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${x * 40}px, ${y * 40}px)`
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${-x * 30}px, ${-y * 30}px)`
      }
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="animated-bg">
      <div className="bg-grid" />
      <div ref={orb1Ref} className="bg-orb bg-orb-1" />
      <div ref={orb2Ref} className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
    </div>
  )
}
