import { DRIVE_SERVICE_ICONS } from './constants';

const KNOWN_DEFAULT_EMOJIS = new Set(['📄', '📊', '📽️', '📋', '🖌️', '🗺️', '🌐', '📜', '🎬', '📑', '📁', '🎯', '📐'])

export function migratePageIcons(data) {
  if (!data?.notebooks) return data
  let changed = false
  const notebooks = data.notebooks.map(nb => ({
    ...nb,
    tabs: nb.tabs?.map(tab => ({
      ...tab,
      pages: tab.pages?.map(page => {
        const serviceIcon = DRIVE_SERVICE_ICONS.find(s => s.type === page.type)
        const needsFavicon = !page.faviconUrl && (serviceIcon || page.type === 'webpage')
        let faviconUrl = page.faviconUrl
        if (!faviconUrl && serviceIcon) {
          faviconUrl = serviceIcon.url
        } else if (!faviconUrl && page.type === 'webpage' && (page.embedUrl || page.webViewLink)) {
          try { faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(page.embedUrl || page.webViewLink).hostname}&sz=128` } catch {}
        }
        const shouldClearIcon = faviconUrl && page.icon && KNOWN_DEFAULT_EMOJIS.has(page.icon)
        if (!needsFavicon && !shouldClearIcon) return page
        if (!faviconUrl && !shouldClearIcon) return page
        changed = true
        const updated = { ...page, ...(faviconUrl && { faviconUrl }) }
        if (shouldClearIcon) delete updated.icon
        return updated
      }) || []
    })) || []
  }))
  return changed ? { ...data, notebooks } : data
}
