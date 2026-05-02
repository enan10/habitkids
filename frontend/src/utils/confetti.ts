interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; size: number; angle: number; spin: number; opacity: number
}

const COLORS = ['#FF6B6B','#FF9F43','#FECA57','#1DD1A1','#54A0FF','#FF9FF3','#48DBFB','#5F27CD']

export function launchConfetti(container: HTMLElement, count = 80) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    opacity: 1,
  }))

  let frame = 0
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1
      p.angle += p.spin
      if (frame > 60) p.opacity -= 0.015
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
      ctx.restore()
    })
    frame++
    if (frame < 120) requestAnimationFrame(animate)
    else canvas.remove()
  }
  requestAnimationFrame(animate)
}
