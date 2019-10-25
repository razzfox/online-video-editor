const { app, BrowserWindow } = require('electron')

// Spin up the express backend as a **side effect**
const { videoAPI } = require('./videoAPI.js')

// fix an error on my machine. maybe related to my brew setup or catalina?
// Error: Invalid package ...electron.asar
// this did not work: process.noAsar = true
// solution:
// cd public
// ln -s /Volumes

const isDev = process.env.NODE_ENV === 'development' || true

if (isDev) {
  // Stop webpack dev server from opening a browser window
  process.env.BROWSER = 'none'

  // webpack checks for 'interactive' TTY before clearing console
  const saveTTY = process.stdout.isTTY
  process.stdout.isTTY = false

  // Spin up the webpack dev server, if in development (loaded as side effect)
  const WebpackDevServer = require('react-scripts/scripts/start')
  process.stdout.isTTY = saveTTY
}

const createWindow = event => {
  // global reference to the window
  var win = new BrowserWindow({
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js',
    },
    show: false,
  })

  isDev
    ? win.loadURL(process.env.ELECTRON_START_URL || 'http://localhost:3000/')
    : win.loadFile(`file://${__dirname}/build/index.html`)

  win.once('ready-to-show', win.show)
  win.once('show', () => win.webContents.openDevTools())
}

app.on('ready', createWindow)

app.on('window-all-closed', app.quit)

// app.on('activate', createWindow)
