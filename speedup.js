import { timeString } from './time.js'

/* global $speedup */

const YEAR = 60 * 60 * 24 * 365.24

export class Speedup {
  constructor (volumeWidthMeters) {
    this.maxMaxDb = volumeWidthMeters / 100
    this.maxMaxDv = 10000
    this.setSpeedup(1)
  }

  setSpeedup (speedup) {
    this.speedup = Math.min(speedup, 100 * YEAR)
    $speedup.innerText = `${timeString(this.speedup)} per second`
  }

  resetMaxDp () {
    this.maxDp = 0
    this.maxDv = 0
  }

  values (dP, dV) {
    this.maxDp = Math.max(Math.abs(dP), this.maxDp)
    this.maxDv = Math.max(Math.abs(dV), this.maxDv)
  }

  adjust () {
    if (this.maxDv > this.maxMaxDv || this.maxDp > this.maxMaxDb) {
      this.setSpeedup(this.speedup / 10)
    } else if (this.maxDv < this.maxMaxDv / 12 && this.maxDp < this.maxMaxDb / 12) {
      this.setSpeedup(this.speedup * 10)
    }
  }
}
