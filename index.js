/* global $canvas */

const ctx = $canvas.getContext('2d')

// Dimensions
const X = 0
const Y = 1
const D = [X, Y]

const DT = 0.01
const MASS = 1
const SIZE = [...D].map(_ => 500)
const SPEED = 0

const G = 100

const N = 100
const GRANULARITY = 10
const space = [...Array(2)].map(_ =>
  [...Array(SIZE[X] / GRANULARITY)].map(_ =>
    [...Array(SIZE[Y] / GRANULARITY)].map(_ => [...D].map(_ => 0))))

let swap = 0

class Particle {
  constructor () {
    this.p = [...D].map((_, i) => Math.random() * SIZE[i])
    this.v = [...D].map((_, i) => SPEED * (Math.random() - 0.5))
    this.m = MASS / (1000 * Math.random())
  }

  draw () {
    ctx.beginPath()
    ctx.arc(this.p[X], this.p[Y], Math.sqrt(this.m) * 10, 0, 2 * Math.PI)
    ctx.stroke()
  }

  update () {
    const force = space[swap][Math.trunc(this.p[X] / GRANULARITY)][Math.trunc(this.p[Y] / GRANULARITY)]
    for (const i in D) {
      this.v[i] += DT * force[i]
      this.p[i] += this.v[i] * DT
    }
  }

  tick () {
    this.update()
    for (const i in D) {
      while (this.p[i] < 0) this.p[i] += SIZE[i]
      while (this.p[i] > SIZE[i]) this.p[i] -= SIZE[i]
    }
  }

  updateSpace () {
    const p = [...D].map(_ => undefined)
    const delta = [...D].map(_ => undefined)
    for (const i in space[swap]) {
      p[X] = i * GRANULARITY + GRANULARITY / 2
      delta[X] = p[X] - this.p[X]
      const dx2 = delta[X] * delta[X]
      const column = space[swap][i]
      for (const j in column) {
        p[Y] = j * GRANULARITY + GRANULARITY / 2
        delta[Y] = p[Y] - this.p[Y]
        const dy2 = delta[Y] * delta[Y]
        const r2 = dx2 + dy2
        const force = column[j]
        for (const k in force) {
          force[k] += -delta[k] * this.m * G / r2
        }
      }
    }
  }
}

const particles = [...Array(N)].map(_ => new Particle())

const FRAME_CHECK = 50
let frame = 0
let lastMs = Date.now()
function draw () {
  ctx.globalCompositeOperation = 'destination-over'
  ctx.clearRect(0, 0, SIZE[X], SIZE[Y])
  for (const particle of particles) {
    particle.draw()
  }
  for (const particle of particles) {
    particle.tick()
  }
  swap = 1 - swap
  for (const column of space[swap]) {
    for (const force of column) {
      for (const i in force) {
        force[i] = 0
      }
    }
  }
  for (const particle of particles) {
    particle.updateSpace()
  }
  if (frame % FRAME_CHECK === 0) {
    const currentMs = Date.now()
    const frameDurationS = (currentMs - lastMs) / (1000.0 * FRAME_CHECK)
    console.log('fps=', 1 / frameDurationS)
    lastMs = currentMs
  }
  ++frame
}

// window.requestAnimationFrame(draw)
setInterval(draw, 1000 / 50)
