/* global $canvas */

const ctx = $canvas.getContext('2d')

// Dimensions
const X = 0
const Y = 1
const D = [X, Y]

const DT = 0.01
const MASS = 0.01
const SIZE = [...D].map(_ => 500)
const SPEED = 0.001

const G = 100000

const N = 500

const DENSITY = 0.2

const radius = mass => Math.sqrt(mass / DENSITY)

class Particle {
  constructor () {
    this.p = [...D].map((_, i) => SIZE[i] / 8 + Math.random() * 3 * SIZE[i] / 4)
    const pFromCenter = this.p.map((p, i) => p - SIZE[i] / 2)
    const dFromCenter = Math.sqrt(pFromCenter.reduce((acc, val) => acc + val * val, 0))
    this.v = [...D].map((_, i) => SPEED * dFromCenter * pFromCenter[1 - i])
    this.v[0] *= -1
    this.m = MASS // (1000 * Math.random())
    this.acceleration = [...D].map(_ => 0)
    this.radius = radius(this.m)
  }

  draw () {
    ctx.beginPath()
    ctx.arc(this.p[X], this.p[Y], this.radius, 0, 2 * Math.PI)
    ctx.stroke()
  }

  updateAcceleration (other) {
    const dp = [...D].map(i => this.p[i] - other.p[i])
    const r = Math.sqrt(dp.reduce(
      (acc, curr) => acc + curr * curr,
      0))
    if (r < this.radius + other.radius) {
      // collided
      this.deleted = true
      for (const i in D) {
        other.v[i] = (other.m * other.v[i] + this.m * this.v[i]) / (other.m + this.m)
        other.p[i] = (other.m * other.p[i] + this.m * this.p[i]) / (other.m + this.m)
      }
      other.m += this.m
      other.radius = radius(other.m)
      return
    }
    for (const i in D) {
      this.acceleration[i] += -dp[i] * other.m * G / (r * r * r)
    }
  }

  update () {
    for (const i in D) {
      this.acceleration[i] = 0
    }
    for (const other of particles) {
      if (other !== this && !other.deleted) {
        this.updateAcceleration(other)
        if (this.deleted) {
          return
        }
      }
    }
    for (const i in D) {
      this.v[i] += DT * this.acceleration[i]
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
}

let particles = [...Array(N)].map(_ => new Particle())

const FRAME_CHECK = 250
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
  particles = particles.filter(particle => !particle.deleted)
  ++frame
  if (frame % FRAME_CHECK === 0) {
    const currentMs = Date.now()
    const frameDurationS = (currentMs - lastMs) / (1000.0 * FRAME_CHECK)
    console.log('fps=', 1 / frameDurationS)
    lastMs = currentMs
  }
}

// window.requestAnimationFrame(draw)
setInterval(draw, 1000 / FRAME_CHECK)
