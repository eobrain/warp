import { timeString } from './time.js'

/* global $speedup */

export class Speedup {
  constructor (volumeWidthMeters) {
    this.maxMaxDb = volumeWidthMeters / 100
    this.setSpeedup(1)
  }

  setSpeedup (speedup) {
    this.speedup = speedup
    $speedup.innerText = `${timeString(this.speedup)} per second`
  }

  resetMaxDp () {
    this.maxDp = 0
  }

  dpIs (dp) {
    const absDp = Math.abs(dp)
    if (absDp > this.maxDp) {
      this.maxDp = absDp
    }
  }

  adjust () {
    if (this.maxDp > this.maxMaxDb) {
      this.setSpeedup(this.speedup / 10)
    } else if (this.maxDp < this.maxMaxDb / 12) {
      this.setSpeedup(this.speedup * 10)
    }
  }
}
