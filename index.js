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

const G = 1

const N = 1000
const GRANULARITY = 20
const space = [...Array(2)].map(_ =>
  [...Array(SIZE[X] / GRANULARITY)].map(_ =>
    [...Array(SIZE[Y] / GRANULARITY)].map(_ => [...D].map(_ => 0))))

let swap = 0

class Particle {
  constructor () {
    this.p = [...D].map((_, i) => Math.random() * SIZE[i])
    this.v = [...D].map((_, i) => SPEED * (Math.random() - 0.5))
  }

  draw () {
    ctx.beginPath()
    ctx.arc(this.p[X], this.p[Y], 1, 0, 2 * Math.PI)
    ctx.stroke()
  }

  update () {
    const force = space[swap][Math.trunc(this.p[X] / GRANULARITY)][Math.trunc(this.p[Y] / GRANULARITY)]
    for (const i in D) {
      this.v[i] += DT * force[i] / MASS
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
      const column = space[swap][i]
      for (const j in column) {
        p[Y] = j * GRANULARITY + GRANULARITY / 2
        delta[Y] = p[Y] - this.p[Y]
        const r2 = delta[X] ** 2 + delta[Y] ** 2
        const force = column[j]
        for (const k in force) {
          force[k] += -delta[k] * G / r2
        }
      }
    }
  }
}

const particles = [...Array(N)].map(_ => new Particle())

// let hue = 0
let labA = 0
let labB = 0

const abWrap = ab => ab < -100 ? 0 : (ab > 100 ? 0 : ab)
const abNext = ab => abWrap(ab + (Math.random() - 0.5) * DT * 1000)

function draw () {
  // ctx.globalCompositeOperation = 'destination-over'
  // ctx.clearRect(0, 0, SIZE[X], SIZE[Y])
  // ctx.strokeStyle = `hsl(${Math.trunc(hue) % 360} 50% 50%)`
  // hue += DT * 10
  ctx.strokeStyle = `lab(50% ${labA}% ${labB}%)`
  labA = abNext(labA)
  labB = abNext(labB)
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
}

// window.requestAnimationFrame(draw)
setInterval(draw, 1000 / 50)
