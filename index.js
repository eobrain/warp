/* global $canvas $time $count $kineticEnergy */

import { Perspective } from './view.js'
import { Controls } from './controls.js'
import { timeString } from './time.js'
import { Randomish } from './randomish.js'
import { euler, rungeKutta } from './integrate.js'

const drawingBufferSize = Math.min(window.screen.width, window.screen.height)
$canvas.width = drawingBufferSize
$canvas.height = drawingBufferSize

// Values entered by the user through the UI
const controls = new Controls()

const ctx = $canvas.getContext('2d')

// All units are SI (meters, kilograms, etc.) unless suffix added

//  const SUN_MASS = 1.9891e30
const JUPITER_MASS = 1.898e27 // in Kg
const AU = 149597870700 // distance from Earth to Sun in metres
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
// const YEAR = DAY * 365.24
// const EARTH_ORBIT_SPEED = 2 * Math.PI * AU / YEAR

// Assume this typical value used by requestAnimationFrame
const FRAMES_PER_SECOND = 60

const SECONDS_PER_FRAME = 1 / FRAMES_PER_SECOND

// Dimension indices
const X = 0
const Y = 1
const Z = 2
const D = [X, Y, Z]

// Mass of each object initially before collisions (in Kg)
const initialMass = controls.jupiters * JUPITER_MASS

// Dimensions of the view in pixels
// const VIEWPORT_SIZE = [...D].map(_ => drawingBufferSize)

// Dimension of the space (metres)
const SIZE = [...D].map(_ => 2 * AU)

// Total mass in Kg of all the objects
const TOTAL_MASS = initialMass * controls.n

const ORBIT_TIME = 7 * DAY
const ANGULAR_VELOCITY = 2 * Math.PI * AU / ORBIT_TIME

const G = 6.6743015e-11

const DENSITY = 1000 // Kg m^-3

const radius = mass => (mass / DENSITY) ** (1.0 / 3.0)

let maxVz = Number.MIN_VALUE
let minVz = Number.MAX_VALUE

const view = new Perspective(SIZE[0] / drawingBufferSize, SIZE)

const FRAME_COLOR = 'green'
const DOT_COLOR = 'magenta'

const randomish = new Randomish(0)

const HISTORY = 2000
const dots = controls.tracks ? [...Array(HISTORY)].map(d => []) : null
let dotCount = 0

// A massive spherical object moving in space
class Particle {
  constructor () {
    // Position vector
    this.p = [...D].map((_, i) => 3 * SIZE[i] / 8 + randomish.random() * SIZE[i] / 4)
    const pFromCenter = this.p.map((p, i) => p - SIZE[i] / 2)
    const dFromCenter = Math.sqrt(pFromCenter.reduce((acc, val) => acc + val * val, 0))

    // Velocity vector
    this.v = [...D]
    // this.v[X] = ANGULAR_VELOCITY * dFromCenter * pFromCenter[Z] / ((SIZE[X] / 2) ** 2)
    // this.v[Y] = 0
    // this.v[Z] = -ANGULAR_VELOCITY * dFromCenter * pFromCenter[X] / ((SIZE[Z] / 2) ** 2)
    this.v[X] = ANGULAR_VELOCITY * dFromCenter * pFromCenter[Y] / ((SIZE[X] / 2) ** 2)
    this.v[Y] = -ANGULAR_VELOCITY * dFromCenter * pFromCenter[X] / ((SIZE[Y] / 2) ** 2)
    this.v[Z] = 0

    // Mass
    this.m = initialMass

    // Acceleration vector
    this.acceleration = [...D].map(_ => 0)

    // radius
    this.radius = radius(this.m)

    // Position vector after next time delta
    this.nextP = [...D]

    // Velocity vector after next time delta
    this.nextV = [...D]

    this.visible = true
  }

  // Draw this object in and HTML canvas
  draw () {
    if (!this.visible) {
      return
    }
    // Set color according to velocity in the Z direction (doppler effect)
    let hue = 0
    let saturation = 0
    if (this.v[Z] > 0) {
      // Moving away so red shift
      hue = 0 // red
      saturation = Math.trunc(100 * this.v[Z] / maxVz)
    } else if (this.v[Z] < 0) {
      // moving towards so blue shift
      hue = 240 // blue
      saturation = Math.trunc(100 * this.v[Z] / minVz)
    }
    const lightness = 100 - Math.trunc(this.p[Z] * 50 / SIZE[Z])
    ctx.fillStyle = `hsl(${hue} ${saturation}% ${lightness}%)`

    // Apply perspective transforms to the radius and the position to get the pixel coordinates
    const rPix = view.transformSize(this.radius, this.p[Z])
    const [xPix, yPix] = view.transform(...this.p)
    const [, yBasePix] = view.transform(this.p[X], SIZE[Y], this.p[Z])

    // Set the color
    ctx.strokeStyle = `rgba(100%, 100%, 100%, ${100 * Math.sqrt(this.m / TOTAL_MASS)}%)`

    // Deaw the vertical line from the bottom of the space to the paricle
    ctx.beginPath()
    ctx.moveTo(xPix, yPix)
    ctx.lineTo(xPix, yBasePix)
    ctx.stroke()

    // Draw the particle as a circle
    ctx.beginPath()
    ctx.arc(
      xPix,
      yPix,
      rPix,
      0, 2 * Math.PI)
    ctx.fill()

    if (controls.tracks && frame % 3 === 0) {
      const dot = dots[(dotCount++) % HISTORY]
      dot[X] = xPix
      dot[Y] = yPix
    }
  }

  // Add acceleration contribution caused other object
  updateAcceleration (other) {
    // Distance vector between this object and other object, taking wrapping into account
    const dp = [...D].map(i => {
      // Normally the distance is just the vector difference
      const d = this.p[i] - other.p[i]
      if (controls.wrap) {
        // When wrapping the closest distance may be wrapping around
        if (d > SIZE[i] / 2) return d - SIZE[i]
        if (d < -SIZE[i] / 2) return d + SIZE[i]
      }
      return d
    })

    // Euclidean dstance between this object and other
    const r = Math.sqrt(dp.reduce(
      (acc, curr) => acc + curr * curr,
      0))

    // Handle collisions by merging two objects, marking one as to be deleted
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

    // Calculate incremental acceleration according to Newton's law of gravitation
    for (const i in D) {
      this.acceleration[i] += -dp[i] * other.m * G / (r * r * r)
    }
  }

  // Update acceleration, velocity, and position
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
      this.nextV[i] = euler(t => this.acceleration[i], this.v[i], dt)
      this.nextP[i] = rungeKutta(t => (this.v[i] + t * this.acceleration[i]), this.p[i], dt)
      if (Math.abs(this.p[i] > 10 * SIZE[i])) {
        this.deleted = true
      }
    }
    minVz = Math.min(minVz, this.v[Z])
    maxVz = Math.max(maxVz, this.v[Z])
  }

  tick (dt) {
    // Update, without considering edges
    this.update(dt)

    // Handle edges by either wrapping or bouncing
    if (controls.wrap) {
      // Wrap by adding or subtracting the height, width, or depth of the space when the object goes beyond the edge
      for (const i in D) {
        while (this.nextP[i] < 0) {
          this.nextP[i] += SIZE[i]
        }
        while (this.nextP[i] > SIZE[i]) {
          this.nextP[i] -= SIZE[i]
        }
      }
    } else if (controls.infinite) {
      // Mark as invisible if beyond the edge
      this.visible = true
      for (const i in D) {
        if (this.nextP[i] < 0 ||
          this.nextP[i] > SIZE[i]) {
          this.visible = false
          break
        }
      }
    } else {
      // Bounce by inverting the velocity vector component in the dimension where the object went past the edge
      for (const i in D) {
        if ((this.nextP[i] < 0 && this.nextV[i] < 0) ||
          (this.nextP[i] > SIZE[i] && this.nextV[i] > 0)) {
          if (controls.bounce) {
            // Bounce off wall
            this.nextV[i] = -this.nextV[i] * 0.90
          } else if (controls.slide) {
            this.nextV[i] = 0
          } else {
            for (const ii in D) {
              this.nextV[ii] = 0
            }
            break
          }
        }
      }
    }
  }
}

// Initialize all the particles
let particles = [...Array(controls.n)].map(_ => new Particle())

// The cubic outline of the space
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

// Draw the cubic outline of the space
function drawFrame () {
  ctx.strokeStyle = FRAME_COLOR
  ctx.beginPath()
  for (let i = 0; i < FRAME_PATH.length; ++i) {
    // Apply the perspective transform to the path to pixel coordinatesz`
    const [xPix, yPix] = view.transform(...FRAME_PATH[i])

    if (i === 0) {
      ctx.moveTo(xPix, yPix)
    } else {
      ctx.lineTo(xPix, yPix)
    }
  }
  ctx.stroke()
}

function drawDots () {
  ctx.fillStyle = DOT_COLOR
  // ctx.beginPath()
  for (const dot of dots) {
    ctx.fillRect(dot[X], dot[Y], 1, 1)
    // ctx.stroke()
  }
}

// Initialize
let time = 0
let frame = 0
let lastMs = Date.now()

let initialKineticEnergy = 0

// Function called on every frame
function draw () {
  const dt = SECONDS_PER_FRAME * controls.speedup

  // Set black background
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, SIZE[X], SIZE[Y])

  // Draw the outline of the space
  drawFrame()

  if (controls.tracks) {
    drawDots()
  }

  // Draw the particles
  for (const particle of particles) {
    particle.draw()
  }

  // calculate new velocies and positions
  for (const particle of particles) {
    particle.tick(dt)
  }

  let kineticEnergy = 0
  // Update postions and velocites with new values
  for (const particle of particles) {
    let v2 = 0
    for (const i in D) {
      particle.p[i] = particle.nextP[i]
      particle.v[i] = particle.nextV[i]
      v2 += particle.v[i] * particle.v[i]
    }
    kineticEnergy += particle.m * v2
  }
  if (initialKineticEnergy === 0) {
    initialKineticEnergy = kineticEnergy
  }

  // Remove particles deleted by collisions
  particles = particles.filter(particle => !particle.deleted)

  // Sort in Z order so nearer objects are drawn on top of farther objects
  particles.sort((a, b) => b.p[Z] - a.p[Z])

  // Update framecount and time
  ++frame
  if (frame % FRAMES_PER_SECOND === 0) {
    const currentMs = Date.now()
    const frameDurationS = (currentMs - lastMs) / (1000.0 * FRAMES_PER_SECOND)
    console.log('fps=', 1 / frameDurationS)
    lastMs = currentMs
  }
  time += dt

  // Update HTML to show time and object count
  $time.innerText = timeString(time)
  $count.innerText = `${particles.length} objects`
  $kineticEnergy.style.width = `${10 * kineticEnergy / initialKineticEnergy}%`

  // schedule next frame
  window.requestAnimationFrame(draw)
  // setTimeout(draw, 0)
}

// Draw first frame
window.requestAnimationFrame(draw)
