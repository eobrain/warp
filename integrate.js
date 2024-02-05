// Numerical integration where the dy/dt is not a function of y

// Integration by Euler method (https://lpsa.swarthmore.edu/NumInt/NumIntFirst.html)
export const euler = (dydt, y0, dt) => y0 + dydt(0) * dt

// Integration by 4th order Runge Kutta method (https://lpsa.swarthmore.edu/NumInt/NumIntFourth.html)
export const rungeKutta = (dydt, y0, dt) => {
  const k1 = dydt(0)
  const kMid = dydt(dt / 2)
  const k4 = dydt(dt)
  return y0 + (k1 + 4 * kMid + k4) * dt / 6
}
export const rungeKuttaAlt = (dydt, y0, dt) => {
  const k1 = dydt(0)
  const kMid = dydt(dt / 2)
  const k4 = dydt(dt)
  return y0 + (k1 + 6 * kMid + k4) * dt / 8
}
