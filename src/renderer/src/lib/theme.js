/**
 * Apply the given theme setting to the document root element.
 * Handles 'system' by reading the OS preference.
 */
export function applyTheme(theme) {
  const root = document.documentElement
  let effective = theme
  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  root.classList.remove('light', 'dark')
  root.classList.add(effective)
}
