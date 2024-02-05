// Numerical Recipes ranqd1, Chapter 7.1, §An Even Quicker Generator, Eq. 7.1.6 parameters from Knuth and H. W. Lewis
const modulus = 0x100000000 // 2^32
const multiplier = 1664525
const constant = 1013904223

export class Randomish {
  constructor (seed) {
    this.x = seed
  }

  random () {
    this.x = (this.x * multiplier + constant) % modulus
    return 1.0 * this.x / modulus
  }
}
