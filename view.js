const FIELD_OF_VIEW_DEGREES = 30
const FIELD_OF_VIEW = FIELD_OF_VIEW_DEGREES * Math.PI / 180
const TAN_HALF_VIEW = Math.tan(FIELD_OF_VIEW / 2)

const X = 0
const Y = 1

export class Perspective {
  constructor (scaleMetresPerPixel, size) {
    this.scaleMetresPerPixel = scaleMetresPerPixel
    this.halfSizeX = size[X] / 2
    this.halfSizeY = size[Y] / 2
    this.cameraZ = size[X] / (2 * TAN_HALF_VIEW)
  }

  transform (x, y, z) {
    const denominator = (this.cameraZ + z) * this.scaleMetresPerPixel
    return [
      this.halfSizeX / this.scaleMetresPerPixel + this.cameraZ * (x - this.halfSizeX) / denominator,
      this.halfSizeY / this.scaleMetresPerPixel + this.cameraZ * (y - this.halfSizeY) / denominator
    ]
  }

  transformSize (r, z) {
    return r * this.cameraZ / ((z + this.cameraZ) * this.scaleMetresPerPixel)
  }
}
