/* global $canvas */

const ctx = $canvas.getContext('2d')

// Dimensions
const X = 0
const Y = 1
const D = [X, Y]

const SIZE = [...D].map(_ => 500)
const SPEED = 10

const DTDP = 0.5

const GRANULARITY = 10
const space = [...Array(2)].map(_ =>
  [...Array(SIZE[X] / GRANULARITY)].map(_ =>
    [...Array(SIZE[Y] / GRANULARITY)].map(_ => [...D].map(_ => DTDP * (1 + Math.random())))))

const swap = 0

class Particle {
  constructor () {
    this.p = [...D].map((_, i) => Math.random() * SIZE[i])
    this.v = [...D].map((_, i) => SPEED * (Math.random() - 0.5))
  }

  draw () {
    ctx.beginPath()
    ctx.arc(this.p[X], this.p[Y], 10, 0, 2 * Math.PI)
    ctx.stroke()
  }

  update () {
    const dtdp = space[swap][Math.trunc(this.p[X] / GRANULARITY)][Math.trunc(this.p[Y] / GRANULARITY)]
    for (const i in D) {
      const delta = this.v[i] * dtdp[i]
      this.p[i] += delta
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

const N = 10

const particles = [...Array(N)].map(_ => new Particle())

function draw () {
  ctx.globalCompositeOperation = 'destination-over'
  ctx.clearRect(0, 0, SIZE[X], SIZE[Y])
  for (const particle of particles) {
    particle.draw()
  }
  for (const particle of particles) {
    particle.tick()
  }
}

// window.requestAnimationFrame(draw)
setInterval(draw, 1000 / 50)
