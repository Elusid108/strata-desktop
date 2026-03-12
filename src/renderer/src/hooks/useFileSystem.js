import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_SETTINGS, INITIAL_DATA } from '../lib/constants'
import { migratePageIcons } from '../lib/migrate-icons'
import { applyTheme } from '../lib/theme'

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

  useEffect(() => { applyTheme(settings.theme) }, [settings.theme])

  const setSettings = useCallback((newSettings) => {
    setSettingsState(newSettings)
  }, [])

  const dataRef = useRef(data)
  dataRef.current = data

  const loadFromLocalStorage = useCallback(() => {
    const d = dataRef.current
    return d.notebooks?.length ? d : null
  }, [])

  return { settings, setSettings, data, setData, loadFromLocalStorage, initialLoadComplete }
}
