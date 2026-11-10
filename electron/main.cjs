const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow } = require('electron')

const DEV_SERVER_URL = 'http://127.0.0.1:5173/'
const isDevelopment = process.argv.includes('--dev') && !app.isPackaged

function createWindow() {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
  const appUrl = isDevelopment ? DEV_SERVER_URL : pathToFileURL(indexPath).href

  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    title: 'Generador de certificados',
    autoHideMenuBar: true,
    backgroundColor: '#f1f5f9',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => ({
    action: url.startsWith('blob:') ? 'allow' : 'deny',
  }))

  window.webContents.on('will-navigate', (event, url) => {
    let isTrustedUrl
    try {
      const target = new URL(url)
      isTrustedUrl = isDevelopment
        ? target.origin === new URL(DEV_SERVER_URL).origin
        : target.protocol === 'file:' &&
          target.pathname === new URL(appUrl).pathname
    } catch {
      event.preventDefault()
      return
    }

    if (!isTrustedUrl) event.preventDefault()
  })

  if (isDevelopment) {
    window.loadURL(appUrl)
  } else {
    window.loadFile(indexPath)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
