/* global $n $jupiters $speedup $wrap $bounce $tracks */

import { timeString } from './time.js'

export class Controls {
  constructor () {
    this.setLogN(2)
    this.setLogJupiters(2)
    this.setLogSpeedup(5.176)
    this.setEdge('bounce')
    this.setTracks('off')
    for (const param of document.location.search.split(/[?&]/)) {
      const [name, value] = param.split(/=/)
      switch (name) {
        case 'n':
          this.setLogN(value)
          $n.control.value = value
          break
        case 'jupiters':
          this.setLogJupiters(value)
          $jupiters.control.value = value
          break
        case 'speedup':
          this.setLogSpeedup(value)
          $speedup.control.value = value
          break
        case 'edge':
          this.setEdge(value)
          document.getElementById('$' + value).checked = true
          break
        case 'tracks':
          this.setTracks(value)
          $tracks.control.checked = this.tracks
          break
        default:
          console.error(`Unknown parameter "${name}=${value}"`)
          break
      }
    }
    $n.control.onchange = () => this.setLogN($n.control.value)
    $jupiters.control.onchange = () => this.setLogJupiters($jupiters.control.value)
    $speedup.control.onchange = () => this.setLogSpeedup($speedup.control.value)
    $bounce.onchange = () => this.setEdge($bounce.checked ? 'bounce' : 'wrap')
    $wrap.onchange = () => this.setEdge($wrap.checked ? 'wrap' : 'bounce')
    $tracks.onchange = () => this.setEdge($tracks.checked ? 'on' : 'off')
  }

  setLogN (logN) {
    this.n = Math.round(10 ** Number(logN))
    $n.innerText = `Initially ${this.n} planets`
  }

  setLogJupiters (jupiters) {
    this.jupiters = 10 ** Number(jupiters)
    $jupiters.innerText = `each of size ${Math.round(this.jupiters)} jupiters`
  }

  setLogSpeedup (speedup) {
    this.speedup = 10 ** Number(speedup)
    $speedup.innerText = `${timeString(this.speedup)} per second`
  }

  setEdge (edge) {
    switch (edge) {
      case 'wrap':
        this.wrap = true
        break
      case 'bounce':
        this.wrap = false
        break
      default:
        console.error(`Unknown edge value "${edge}"`)
        break
    }
  }

  setTracks (tracks) {
    this.tracks = (tracks === 'on')
  }
}
