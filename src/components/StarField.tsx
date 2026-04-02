import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  baseOpacity: number
  opacity: number
  phase: number
  speed: number
  dx: number
  dy: number
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let stars: Star[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      stars = Array.from({ length: 300 }, () => {
        const baseOpacity = 0.3 + Math.random() * 0.7
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 0.5 + Math.random() * 1.5,
          baseOpacity,
          opacity: baseOpacity,
          phase: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.008,
          dx: (Math.random() - 0.5) * 0.08,
          dy: (Math.random() - 0.5) * 0.08,
        }
      })
    }

    let t = 0
    const draw = () => {
      t += 0.016
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const star of stars) {
        star.x += star.dx
        star.y += star.dy

        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0

        star.opacity = star.baseOpacity * (0.6 + 0.4 * Math.sin(t * star.speed * 60 + star.phase))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
