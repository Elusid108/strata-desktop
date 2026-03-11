import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_SETTINGS, INITIAL_DATA, DRIVE_SERVICE_ICONS } from '../lib/constants'

const KNOWN_DEFAULT_EMOJIS = new Set(['📄', '📊', '📽️', '📋', '🖌️', '🗺️', '🌐', '📜', '🎬', '📑', '📁', '🎯', '📐'])

function migratePageIcons(data) {
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

export function useFileSystem() {
  const isElectron = !!window.electronAPI?.isElectron
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS)
  const [data, setData] = useState(INITIAL_DATA)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const debouncedSaveRef = useRef(null)

  useEffect(() => {
    if (!isElectron) {
      setInitialLoadComplete(true)
      return
    }

    const load = async () => {
      const savedSettings = await window.electronAPI.fs.loadSettings()
      if (savedSettings) {
        setSettingsState(prev => ({ ...DEFAULT_SETTINGS, ...savedSettings }))
      } else {
        const lsSettings = localStorage.getItem('note-app-settings-v1')
        if (lsSettings) {
          try {
            const parsed = JSON.parse(lsSettings)
            setSettingsState(prev => ({ ...DEFAULT_SETTINGS, ...parsed }))
            await window.electronAPI.fs.saveSettings({ ...DEFAULT_SETTINGS, ...parsed })
          } catch { /* ignore */ }
        }
      }

      let savedData = await window.electronAPI.fs.loadData()
      if (!savedData) {
        const lsData = localStorage.getItem('note-app-data-v1')
        if (lsData) {
          try {
            savedData = JSON.parse(lsData)
            await window.electronAPI.fs.saveData(savedData)
            localStorage.removeItem('note-app-data-v1')
          } catch { /* ignore */ }
        }
      }
      if (savedData) {
        const migrated = migratePageIcons(savedData)
        setData(migrated)
      }

      setInitialLoadComplete(true)
    }
    load()
  }, [isElectron])

  useEffect(() => {
    if (!isElectron || !initialLoadComplete) return
    if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current)
    debouncedSaveRef.current = setTimeout(async () => {
      await window.electronAPI.fs.saveData(data)
      await window.electronAPI.fs.saveSettings(settings)
    }, 500)
    return () => clearTimeout(debouncedSaveRef.current)
  }, [data, settings, initialLoadComplete, isElectron])

  useEffect(() => {
    const root = document.documentElement
    let effectiveTheme = settings.theme
    if (settings.theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)
  }, [settings.theme])

  const setSettings = useCallback((newSettings) => {
    setSettingsState(newSettings)
  }, [])

  const loadFromLocalStorage = useCallback(() => {
    return data.notebooks?.length ? data : null
  }, [data])

  return { settings, setSettings, data, setData, loadFromLocalStorage, initialLoadComplete }
}
