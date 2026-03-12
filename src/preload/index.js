import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  embed: {
    show:       (pageId, url, bounds) => ipcRenderer.invoke('embed:show',       { pageId, url, bounds }),
    hide:       (pageId)              => ipcRenderer.invoke('embed:hide',       { pageId }),
    hideAll:    ()                    => ipcRenderer.invoke('embed:hideAll'),
    navigate:   (pageId, url)         => ipcRenderer.invoke('embed:navigate',   { pageId, url }),
    resize:     (pageId, bounds)      => ipcRenderer.invoke('embed:resize',     { pageId, bounds }),
    destroy:    (pageId)              => ipcRenderer.invoke('embed:destroy',    { pageId }),
    fetchTitle:    (url)                 => ipcRenderer.invoke('embed:fetchTitle',    { url }),
    fetchFavicon:  (url)                 => ipcRenderer.invoke('embed:fetchFavicon',  { url }),
    setLimit:      (limit)               => ipcRenderer.invoke('embed:setLimit',      { limit }),
    goBack:        (pageId)              => ipcRenderer.invoke('embed:goBack',        { pageId }),
    goForward:     (pageId)              => ipcRenderer.invoke('embed:goForward',     { pageId }),
    getCurrentUrl: (pageId)              => ipcRenderer.invoke('embed:getCurrentUrl', { pageId }),
  },
  fs: {
    loadData:     ()    => ipcRenderer.invoke('fs:loadData'),
    saveData:     (data) => ipcRenderer.invoke('fs:saveData', data),
    loadSettings: ()    => ipcRenderer.invoke('fs:loadSettings'),
    saveSettings: (s)   => ipcRenderer.invoke('fs:saveSettings', s),
    loadLastView: ()    => ipcRenderer.invoke('fs:loadLastView'),
    saveLastView: (v)   => ipcRenderer.invoke('fs:saveLastView', v),
    getDataPath:  ()    => ipcRenderer.invoke('fs:getDataPath'),
  },
  onWindowResized:    (cb) => ipcRenderer.on('window:resized',    cb),
  offWindowResized:   (cb) => ipcRenderer.removeListener('window:resized', cb),
  onEmbedHibernated:  (cb) => {
    const wrapper = (_e, data) => cb(data)
    ipcRenderer.on('embed:hibernated', wrapper)
    return wrapper
  },
  offEmbedHibernated: (wrapper) => ipcRenderer.removeListener('embed:hibernated', wrapper),
  onEmbedRestored:    (cb) => {
    const wrapper = (_e, data) => cb(data)
    ipcRenderer.on('embed:restored', wrapper)
    return wrapper
  },
  offEmbedRestored:   (wrapper) => ipcRenderer.removeListener('embed:restored', wrapper),
})
