/* global $n $jupiters */

export class Controls {
  constructor () {
    this.setN(100)
    this.setJupiters(100)
    for (const param of document.location.search.split(/[?&]/)) {
      const [name, value] = param.split(/=/)
      switch (name) {
        case 'n':
          this.setN(value)
          $n.control.value = value
          break
        case 'jupiters':
          this.setJupiters(value)
          $jupiters.control.value = value
          break
        case '':
          break
        default:
          console.error(`Unknown parameter "${name}=${value}`)
          break
      }
    }
    $n.control.onchange = () => this.setN($n.control.value)
    $jupiters.control.onchange = () => this.setJupiters($jupiters.control.value)
  }

  setN (n) {
    this.n = Number(n)
    $n.innerText = `Initially ${this.n} planets`
  }

  setJupiters (jupiters) {
    this.jupiters = Number(jupiters)
    $jupiters.innerText = `each of size ${this.jupiters} jupiters`
  }
}
