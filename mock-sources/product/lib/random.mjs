/** Inclusive integer in [min, max]. Fresh entropy on every call so fetches change. */
export function randomInt(min, max) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

export function isoNow() {
  return new Date().toISOString();
}
