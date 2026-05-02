let audioCtx: AudioContext | null = null

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioCtx
}

function playTone(freq: number, start: number, duration: number, gain: number, ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.connect(g)
  g.connect(ctx.destination)
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  g.gain.setValueAtTime(gain, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration)
}

export function playComplete() {
  try {
    const ctx = getCtx()
    playTone(523, 0,    0.12, 0.25, ctx) // C5
    playTone(659, 0.1,  0.12, 0.25, ctx) // E5
    playTone(784, 0.2,  0.25, 0.25, ctx) // G5
  } catch {}
}

export function playPerfectDay() {
  try {
    const ctx = getCtx()
    const melody = [523, 659, 784, 1047]
    melody.forEach((freq, i) => playTone(freq, i * 0.12, 0.2, 0.2, ctx))
  } catch {}
}

export function playBadge() {
  try {
    const ctx = getCtx()
    playTone(784,  0,    0.1,  0.2, ctx)
    playTone(988,  0.1,  0.1,  0.2, ctx)
    playTone(1175, 0.2,  0.3,  0.2, ctx)
    playTone(1568, 0.35, 0.4,  0.2, ctx)
  } catch {}
}

export function playUncomplete() {
  try {
    const ctx = getCtx()
    playTone(400, 0, 0.15, 0.1, ctx)
    playTone(300, 0.1, 0.15, 0.1, ctx)
  } catch {}
}
