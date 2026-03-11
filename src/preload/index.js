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
    fetchTitle: (url)                 => ipcRenderer.invoke('embed:fetchTitle', { url }),
    setLimit:   (limit)              => ipcRenderer.invoke('embed:setLimit',   { limit }),
  },
  onWindowResized:    (cb) => ipcRenderer.on('window:resized',    cb),
  onEmbedHibernated:  (cb) => ipcRenderer.on('embed:hibernated',  (_e, data) => cb(data)),
  onEmbedRestored:    (cb) => ipcRenderer.on('embed:restored',    (_e, data) => cb(data)),
})
