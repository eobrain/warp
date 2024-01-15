/* global $canvas */

const ctx = $canvas.getContext('2d')

// Dimensions
const X = 0
const Y = 1
const Z = 2
const D = [X, Y, Z]
const D2 = [X, Y]

const DT = 0.01
const MASS = 0.02
const SIZE = [...D].map(_ => 500)
const SPEED = 0.0015

const G = 100000

const N = 200

const TOTAL_MASS = MASS * N

const DENSITY = 0.02

const radius = mass => Math.sqrt(mass / DENSITY)

let maxVz = Number.MIN_VALUE
let minVz = Number.MAX_VALUE

class Particle {
  constructor () {
    this.p = [...D].map((_, i) => SIZE[i] / 4 + Math.random() * SIZE[i] / 2)
    const pFromCenter = this.p.map((p, i) => p - SIZE[i] / 2)
    const dFromCenter = Math.sqrt(pFromCenter.reduce((acc, val) => acc + val * val, 0))
    this.v = [...D2].map((_, i) => SPEED * dFromCenter * pFromCenter[1 - i])
    this.v[X] *= -1
    this.v[Z] = 0
    this.m = MASS // (1000 * Math.random())
    this.acceleration = [...D].map(_ => 0)
    this.radius = radius(this.m)
    this.nextP = [...D]
    this.nextV = [...D]
  }

  draw () {
    let hue = 0
    let saturation = 0
    if (this.v[Z] > 0) {
      hue = 0 // red
      saturation = Math.trunc(100 * this.v[Z] / maxVz)
    } else if (this.v[Z] < 0) {
      hue = 240 // blue
      saturation = Math.trunc(100 * this.v[Z] / minVz)
    }
    const lightness = 50 + Math.trunc(this.p[Z] * 50 / SIZE[Z])

    ctx.fillStyle = `hsl(${hue} ${saturation}% ${lightness}%)`
    ctx.beginPath()
    ctx.arc(this.p[X], this.p[Y], this.radius, 0, 2 * Math.PI)
    ctx.arc(this.p[X] - DT * this.v[X], this.p[Y] - DT * this.v[Y], this.radius, 0, 2 * Math.PI)
    ctx.fill()
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

  update (mps, mvs) {
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
      this.nextV[i] = this.v[i] + DT * this.acceleration[i]
      this.nextP[i] = this.p[i] + this.nextV[i] * DT
      mps[i] += this.nextP[i] * this.m
      mvs[i] += this.nextV[i] * this.m
      if (Math.abs(this.p[i] > 10 * SIZE[i])) {
        this.deleted = true
      }
    }
    minVz = Math.min(minVz, this.v[Z])
    maxVz = Math.max(maxVz, this.v[Z])
  }

  tick (mps, mvs) {
    this.update(mps, mvs)
    /* for (const i in D) {
      while (this.p[i] < 0) this.p[i] += SIZE[i]
      while (this.p[i] > SIZE[i]) this.p[i] -= SIZE[i]
    } */
  }
}

let particles = [...Array(N)].map(_ => new Particle())

const FRAME_CHECK = 250
let frame = 0
let lastMs = Date.now()
function draw () {
  // ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, SIZE[X], SIZE[Y])
  for (const particle of particles) {
    particle.draw()
  }
  const mps = D.map(_ => 0)
  const mvs = D.map(_ => 0)
  for (const particle of particles) {
    particle.tick(mps, mvs)
  }
  for (const i in D) {
    for (const particle of particles) {
      particle.p[i] = particle.nextP[i]
      particle.v[i] = particle.nextV[i]
    }
    const centerOfGravity = mps[i] / TOTAL_MASS
    const meanVelocity = mvs[i] / TOTAL_MASS
    const offset = centerOfGravity - SIZE[i] / 2
    if (Math.abs(offset) > SIZE[i] / 4) {
      for (const particle of particles) {
        particle.p[i] -= offset
        particle.v[i] -= meanVelocity
      }
    }
  }

  particles = particles.filter(particle => !particle.deleted)
  particles.sort((a, b) => a.p[Z] - b.p[Z])
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
