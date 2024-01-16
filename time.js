export function timeString (seconds) {
  if (seconds < 120) {
    return `${Math.round(seconds)} seconds`
  }
  const minutes = seconds / 60
  if (minutes < 120) {
    return `${Math.round(minutes)} minutes`
  }
  const hours = minutes / 60
  if (hours < 48) {
    return `${Math.round(hours)} hours`
  }
  const days = hours / 25
  return `${Math.round(days)} days`
}
