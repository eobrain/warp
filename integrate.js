// Numerical integration where the dy/dt is not a function of y

// Integration by Euler method (https://lpsa.swarthmore.edu/NumInt/NumIntFirst.html)
// Return incremental change in y
export const euler = (dydt, dt) => dydt(0) * dt

// Integration by 4th order Runge Kutta method (https://lpsa.swarthmore.edu/NumInt/NumIntFourth.html)
// Return incremental change in y
export const rungeKutta = (dydt, dt) => {
  const k1 = dydt(0)
  const kMid = dydt(dt / 2)
  const k4 = dydt(dt)
  return (k1 + 4 * kMid + k4) * dt / 6
}
export const rungeKuttaAlt = (dydt, dt) => {
  const k1 = dydt(0)
  const kMid = dydt(dt / 2)
  const k4 = dydt(dt)
  return (k1 + 6 * kMid + k4) * dt / 8
}
