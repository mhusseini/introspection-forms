/**
 * Reads form data from browser storage.
 */
export function readStorage(type: 'session' | 'local', key: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const storage = type === 'session' ? sessionStorage : localStorage
    const raw = storage.getItem(`introspection-form:${key}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Writes form data to browser storage.
 */
export function writeStorage(type: 'session' | 'local', key: string, data: unknown): void {
  if (typeof window === 'undefined') return
  try {
    const storage = type === 'session' ? sessionStorage : localStorage
    storage.setItem(`introspection-form:${key}`, JSON.stringify(data))
  } catch {
    // Storage may be full or unavailable
  }
}

/**
 * Clears form data from browser storage.
 */
export function clearStorage(type: 'session' | 'local', key: string): void {
  if (typeof window === 'undefined') return
  try {
    const storage = type === 'session' ? sessionStorage : localStorage
    storage.removeItem(`introspection-form:${key}`)
  } catch {
    // Ignore
  }
}
