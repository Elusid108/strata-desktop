import { ipcMain, app } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

function getDataDir() {
  return join(app.getPath('documents'), 'Strata')
}

async function ensureDataDir() {
  const dir = getDataDir()
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  return dir
}

async function readJSON(filename) {
  try {
    const dir = await ensureDataDir()
    const content = await readFile(join(dir, filename), 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function writeJSON(filename, value) {
  const dir = await ensureDataDir()
  await writeFile(join(dir, filename), JSON.stringify(value, null, 2), 'utf-8')
}

export function registerFileStoreHandlers() {
  ipcMain.handle('fs:loadData',     async () => readJSON('data.json'))
  ipcMain.handle('fs:saveData',     async (_e, data) => writeJSON('data.json', data))
  ipcMain.handle('fs:loadSettings', async () => readJSON('settings.json'))
  ipcMain.handle('fs:saveSettings', async (_e, settings) => writeJSON('settings.json', settings))
  ipcMain.handle('fs:loadLastView', async () => readJSON('last-view.json'))
  ipcMain.handle('fs:saveLastView', async (_e, view) => writeJSON('last-view.json', view))
  ipcMain.handle('fs:getDataPath',  async () => getDataDir())
}
