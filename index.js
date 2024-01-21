/* global $canvas $time $count */

import { Perspective } from './view.js'
import { Controls } from './controls.js'
import { timeString } from './time.js'

const controls = new Controls()

const ctx = $canvas.getContext('2d')

// All units are SI (meters, kilograms, etc.) unless suffix added

//  const SUN_MASS = 1.9891e30
const JUPITER_MASS = 1.898e27
const AU = 149597870700 // distance from Earth to Sun
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
// const YEAR = DAY * 365.24
// const EARTH_ORBIT_SPEED = 2 * Math.PI * AU / YEAR

const FRAMES_PER_SECOND = 250
const SECONDS_PER_FRAME = 1 / FRAMES_PER_SECOND

// Dimensions
const X = 0
const Y = 1
const Z = 2
const D = [X, Y, Z]
const D2 = [X, Y]

const initialMass = controls.jupiters * JUPITER_MASS
const VIEWPORT_SIZE = [...D].map(_ => 500)
const SIZE = [...D].map(_ => AU)
const TOTAL_MASS = initialMass * controls.n

const ORBIT_TIME = 7 * DAY
const ANGULAR_VELOCITY = 2 * Math.PI * AU / ORBIT_TIME

const G = 6.6743015e-11

const DENSITY = 1000 // Kg m^-3

const radius = mass => (mass / DENSITY) ** (1.0 / 3.0)

let maxVz = Number.MIN_VALUE
let minVz = Number.MAX_VALUE

const view = new Perspective(SIZE[0] / VIEWPORT_SIZE[0], SIZE)

const FRAME_COLOR = 'green'

class Particle {
  constructor () {
    this.p = [...D].map((_, i) => SIZE[i] / 4 + Math.random() * SIZE[i] / 2)
    const pFromCenter = this.p.map((p, i) => p - SIZE[i] / 2)
    const dFromCenter = Math.sqrt(pFromCenter.reduce((acc, val) => acc + val * val, 0))
    this.v = [...D2].map((_, i) => ANGULAR_VELOCITY * dFromCenter * pFromCenter[1 - i] / (SIZE[i] ** 2))
    this.v[X] *= -1
    this.v[Z] = 0
    this.m = initialMass
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
    const lightness = 100 - Math.trunc(this.p[Z] * 50 / SIZE[Z])

    const rPix = view.transformSize(this.radius, this.p[Z])
    const [xPix, yPix] = view.transform(...this.p)

    ctx.fillStyle = `hsl(${hue} ${saturation}% ${lightness}%)`

    const [, yBasePix] = view.transform(this.p[X], SIZE[Y], this.p[Z])
    ctx.strokeStyle = `rgba(100%, 100%, 100%, ${100 * Math.sqrt(this.m / TOTAL_MASS)}%)`
    ctx.beginPath()
    ctx.moveTo(xPix, yPix)
    ctx.lineTo(xPix, yBasePix)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(
      xPix,
      yPix,
      rPix,
      0, 2 * Math.PI)
    ctx.fill()
  }

  updateAcceleration (other) {
    const dp = [...D].map(i => {
      if (!controls.wrap) {
        return this.p[i] - other.p[i]
      }
      const d = this.p[i] - other.p[i]
      if (d > SIZE[i] / 2) return d - SIZE[i]
      if (d < -SIZE[i] / 2) return d + SIZE[i]
      return d
    })

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

  update (dt) {
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
      this.nextV[i] = this.v[i] + dt * this.acceleration[i]
      this.nextP[i] = this.p[i] + this.nextV[i] * dt
      if (Math.abs(this.p[i] > 10 * SIZE[i])) {
        this.deleted = true
      }
    }
    minVz = Math.min(minVz, this.v[Z])
    maxVz = Math.max(maxVz, this.v[Z])
  }

  tick (dt) {
    this.update(dt)
    if (controls.wrap) {
      for (const i in D) {
        while (this.nextP[i] < 0) {
          this.nextP[i] += SIZE[i]
        }
        while (this.nextP[i] > SIZE[i]) {
          this.nextP[i] -= SIZE[i]
        }
      }
    } else {
      for (const i in D) {
        if (this.nextP[i] < 0 || this.nextP[i] > SIZE[i]) {
          // Bounce off wall
          this.nextV[i] = -this.nextV[i] * 0.90
        }
      }
    }
  }
}

let particles = [...Array(controls.n)].map(_ => new Particle())

const FRAME_PATH = [
  [0, 0, 0],
  [0, 0, 1],
  [0, 1, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 1, 1],
  [1, 1, 0],
  [1, 1, 1],
  [1, 0, 1],
  [1, 0, 0],
  [1, 0, 1],
  [0, 0, 1]
].map(pu => pu.map((u, i) => u * SIZE[i]))

function drawFrame () {
  ctx.strokeStyle = FRAME_COLOR
  ctx.beginPath()
  for (let i = 0; i < FRAME_PATH.length; ++i) {
    const [xPix, yPix] = view.transform(...FRAME_PATH[i])
    if (i === 0) {
      ctx.moveTo(xPix, yPix)
    } else {
      ctx.lineTo(xPix, yPix)
    }
  }
  ctx.stroke()
}

let time = 0

let frame = 0
let lastMs = Date.now()
function draw () {
  const dt = SECONDS_PER_FRAME * controls.speedup

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, SIZE[X], SIZE[Y])
  drawFrame()
  for (const particle of particles) {
    particle.draw()
  }
  for (const particle of particles) {
    particle.tick(dt)
  }
  for (const i in D) {
    for (const particle of particles) {
      particle.p[i] = particle.nextP[i]
      particle.v[i] = particle.nextV[i]
    }
  }

  particles = particles.filter(particle => !particle.deleted)
  particles.sort((a, b) => b.p[Z] - a.p[Z])
  ++frame
  if (frame % FRAMES_PER_SECOND === 0) {
    const currentMs = Date.now()
    const frameDurationS = (currentMs - lastMs) / (1000.0 * FRAMES_PER_SECOND)
    console.log('fps=', 1 / frameDurationS)
    lastMs = currentMs
  }
  time += dt
  $time.innerText = timeString(time)
  $count.innerText = `${particles.length} objects`
}

// window.requestAnimationFrame(draw)
setInterval(draw, 1000 / FRAMES_PER_SECOND)
