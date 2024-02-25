import { timeString } from './time.js'

/* global $speedup */

const YEAR = 60 * 60 * 24 * 365.24
const FACTOR = 0.1

const loqQuantize = x => 10 ** Math.round(Math.log10(x))
// const loqQuantize = x => Math.exp(Math.round(Math.log(x)))

export class Speedup {
  constructor (initialRadius, velocity) {
    this.maxMaxDp = initialRadius
    this.maxMaxDv = velocity / 50000
    this.setSpeedup(1)
    this.nFunc = () => 100
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
    // const fullyAdjusted = this.speedup * Math.sqrt((this.maxMaxDv / this.maxDv) * (this.maxMaxDp / this.maxDp))
    // this.setSpeedup((this.speedup * FACTOR + fullyAdjusted) / (FACTOR + 1))

    // this.setSpeedup(loqQuantize(this.speedup * Math.sqrt((this.maxMaxDv / this.maxDv) * (this.maxMaxDp / this.maxDp))))
    //    const dSpeedup = this.speedup * (Math.sqrt((this.maxMaxDv / this.maxDv) * (this.maxMaxDp / this.maxDp)) - 1)
    const dSpeedup = this.speedup * (this.maxMaxDp / this.maxDp - 1)
    this.setSpeedup(this.speedup + FACTOR * dSpeedup / this.nFunc())
    // this.setSpeedup((FACTOR - 1) * this.speedup + FACTOR * this.speedup * Math.sqrt((this.maxMaxDv / this.maxDv) * (this.maxMaxDp / this.maxDp)))
    // this.setSpeedup(loqQuantize(this.speedup * this.maxMaxDv / this.maxDv))
    // this.setSpeedup(this.speedup * this.maxMaxDv / this.maxDv)
    // this.setSpeedup(loqQuantize(this.speedup * this.maxMaxDp / this.maxDp))
    // this.setSpeedup(this.speedup * this.maxMaxDp / this.maxDp)
  }
}
