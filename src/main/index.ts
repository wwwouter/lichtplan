import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    title: 'Lichtplan - Nieuw project',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Bestand',
      submenu: [
        {
          label: 'Nieuw project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-project')
        },
        {
          label: 'Openen...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-project')
        },
        {
          label: 'Opslaan',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save-project')
        },
        {
          label: 'Opslaan als...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:save-project-as')
        },
        { type: 'separator' },
        {
          label: 'Plattegrond laden...',
          click: () => mainWindow?.webContents.send('menu:load-image')
        },
        { type: 'separator' },
        {
          label: 'Exporteren als PNG',
          click: () => mainWindow?.webContents.send('menu:export-png')
        },
        {
          label: 'Exporteren als PDF',
          click: () => mainWindow?.webContents.send('menu:export-pdf')
        },
        { type: 'separator' },
        { role: 'quit', label: 'Afsluiten' }
      ]
    },
    {
      label: 'Bewerken',
      submenu: [
        { role: 'undo', label: 'Ongedaan maken' },
        { role: 'redo', label: 'Opnieuw' },
        { type: 'separator' },
        { role: 'cut', label: 'Knippen' },
        { role: 'copy', label: 'Kopiëren' },
        { role: 'paste', label: 'Plakken' },
        { role: 'selectAll', label: 'Alles selecteren' }
      ]
    },
    {
      label: 'Beeld',
      submenu: [
        { role: 'reload', label: 'Herladen' },
        { role: 'toggleDevTools', label: 'Developer Tools' },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Inzoomen' },
        { role: 'zoomOut', label: 'Uitzoomen' },
        { role: 'resetZoom', label: 'Werkelijke grootte' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Volledig scherm' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC Handlers
function setupIPC(): void {
  ipcMain.handle('dialog:open-project', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Open Lichtplan',
      filters: [{ name: 'Lichtplan', extensions: ['lichtplan'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const data = await readFile(filePath, 'utf-8')
    return { filePath, data }
  })

  ipcMain.handle('dialog:save-project', async (_event, { data, filePath }) => {
    let savePath = filePath
    if (!savePath) {
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Opslaan als',
        filters: [{ name: 'Lichtplan', extensions: ['lichtplan'] }],
        defaultPath: 'project.lichtplan'
      })
      if (result.canceled || !result.filePath) return null
      savePath = result.filePath
    }
    await writeFile(savePath, data, 'utf-8')
    return savePath
  })

  ipcMain.handle('dialog:save-project-as', async (_event, { data }) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Opslaan als',
      filters: [{ name: 'Lichtplan', extensions: ['lichtplan'] }],
      defaultPath: 'project.lichtplan'
    })
    if (result.canceled || !result.filePath) return null
    await writeFile(result.filePath, data, 'utf-8')
    return result.filePath
  })

  ipcMain.handle('dialog:open-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Plattegrond laden',
      filters: [{ name: 'Afbeeldingen', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const buffer = await readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'png'
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`
    const fileName = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? 'image'
    return { data: base64, fileName }
  })

  ipcMain.handle('dialog:export-png', async (_event, { dataUrl, fileName }) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Exporteren als PNG',
      filters: [{ name: 'PNG', extensions: ['png'] }],
      defaultPath: fileName
    })
    if (result.canceled || !result.filePath) return null
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
    await writeFile(result.filePath, Buffer.from(base64Data, 'base64'))
    return result.filePath
  })

  ipcMain.handle('dialog:export-pdf', async (_event, { pdfData, fileName }) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Exporteren als PDF',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      defaultPath: fileName
    })
    if (result.canceled || !result.filePath) return null
    await writeFile(result.filePath, Buffer.from(pdfData))
    return result.filePath
  })

  ipcMain.on('set-title', (_event, title: string) => {
    mainWindow?.setTitle(title)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.lichtplan')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  buildMenu()
  setupIPC()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
