const {app, BrowserWindow} = require('electron')

// Spin up the express backend as a **side effect**
const { videoAPI } = require('./videoAPI.js')

const isProduction = process.env.NODE_ENV === 'production'

// Spin up the react dev server, if in development
// Stop react dev server from opening a browser window
// despite what the documentiation says, setting BROWSER does nothing
// process.env.BROWSER = 'none'
// react actually checks for 'interactive' TTY when opening the browser window
const saveTTY = process.stdout.isTTY
process.stdout.isTTY = false
const React = isProduction || require('../node_modules/react-scripts/scripts/start.js')
process.stdout.isTTY = saveTTY

const prodURL =`file://${__dirname}/build/index.html`
const devURL = process.env.ELECTRON_START_URL || 'http://localhost:3000/'
const startURL = isProduction ? prodURL : devURL

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // do not create more than one window, or add to an array if more than one window is supported
  if(mainWindow !== null) return

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false
    }
  })

  // Load the index.html of the app
  mainWindow.loadURL(startURL)
  
  // Open the DevTools
  isProduction || mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}


app.on('ready', createWindow)

app.on('window-all-closed', app.quit)

// app.on('will-quit', () => {})

app.on('activate', createWindow)
