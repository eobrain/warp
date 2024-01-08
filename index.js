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

const G = 10000

const N = 200

class Particle {
  constructor () {
    this.p = [...D].map((_, i) => Math.random() * SIZE[i])
    this.v = [...D].map((_, i) => SPEED * (Math.random() - 0.5))
    this.m = MASS / (1000 * Math.random())
    this.acceleration = [...D].map(_ => 0)
  }

  draw () {
    ctx.beginPath()
    ctx.arc(this.p[X], this.p[Y], Math.sqrt(this.m) * 10, 0, 2 * Math.PI)
    ctx.stroke()
  }

  updateAcceleration (other) {
    const dp = [...D].map(i => this.p[i] - other.p[i])
    const r = Math.sqrt(dp.reduce(
      (acc, curr) => acc + curr * curr,
      0))
    for (const i in D) {
      this.acceleration[i] += -dp[i] * other.m * G / (r * r * r)
    }
  }

  update () {
    for (const i in D) {
      this.acceleration[i] = 0
    }
    for (const other of particles) {
      if (other !== this) {
        this.updateAcceleration(other)
      }
    }
    for (const i in D) {
      this.v[i] += DT * this.acceleration[i]
      this.p[i] += this.v[i] * DT
    }
  }

  tick () {
    this.update()
    /* for (const i in D) {
      while (this.p[i] < 0) this.p[i] += SIZE[i]
      while (this.p[i] > SIZE[i]) this.p[i] -= SIZE[i]
    } */
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
