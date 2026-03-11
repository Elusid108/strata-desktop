import { app, BrowserWindow, WebContentsView, ipcMain, session, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Strata',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false,
    }
  })

  // Handle popup windows: allow Google OAuth to open as an Electron popup,
  // send all other external links to the default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    const isGoogleAuth = url.startsWith('https://accounts.google.com/') ||
                         url.startsWith('https://oauth2.googleapis.com/')
    if (isGoogleAuth) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          modal: true,
          parent: win,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        }
      }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Notify renderer when window is resized so embed views can be repositioned
  win.on('resize', () => win.webContents.send('window:resized'))

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // --- WebContentsView embed management ---
  const embedViews = new Map() // pageId -> WebContentsView

  ipcMain.handle('embed:show', async (_e, { pageId, url, bounds }) => {
    let view = embedViews.get(pageId)
    if (!view) {
      view = new WebContentsView({ webPreferences: { contextIsolation: true } })
      embedViews.set(pageId, view)
      win.contentView.addChildView(view)
    }
    // Navigate only when the URL has changed (avoids unnecessary reloads)
    if (view._requestedUrl !== url) {
      view._requestedUrl = url
      view.webContents.loadURL(url)
    }
    view.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height })
    view.setVisible(true)
  })

  ipcMain.handle('embed:hide', async (_e, { pageId }) => {
    const view = embedViews.get(pageId)
    if (view) view.setVisible(false)
  })

  ipcMain.handle('embed:hideAll', async () => {
    embedViews.forEach(v => v.setVisible(false))
  })

  ipcMain.handle('embed:navigate', async (_e, { pageId, url }) => {
    const view = embedViews.get(pageId)
    if (view) {
      view._requestedUrl = url
      view.webContents.loadURL(url)
    }
  })

  ipcMain.handle('embed:resize', async (_e, { pageId, bounds }) => {
    const view = embedViews.get(pageId)
    if (view?.isVisible()) {
      view.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height })
    }
  })

  ipcMain.handle('embed:destroy', async (_e, { pageId }) => {
    const view = embedViews.get(pageId)
    if (view) {
      win.contentView.removeChildView(view)
      view.webContents.close()
      embedViews.delete(pageId)
    }
  })
}

// Fetch the <title> of a URL from the main process (no CORS restrictions)
ipcMain.handle('embed:fetchTitle', async (_, { url }) => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const html = await response.text()
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (!match || !match[1].trim()) return null
    return match[1].trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
  } catch {
    return null
  }
})

app.whenReady().then(() => {
  // Strip "Electron/x.x.x" from the user agent so sites that block Electron
  // (e.g. Lucidchart) treat requests as coming from a standard Chromium browser.
  app.userAgentFallback = app.userAgentFallback.replace(/\s*Electron\/[\d.]+/, '')

  // Strip X-Frame-Options and CSP headers so any URL can be embedded
  // without iframe restrictions (Gmail, Google Docs, etc.)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    delete headers['x-frame-options']
    delete headers['X-Frame-Options']
    delete headers['content-security-policy']
    delete headers['Content-Security-Policy']
    callback({ responseHeaders: headers })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
