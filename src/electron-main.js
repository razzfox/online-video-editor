// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')

// Get env info
const isDev = process.env.DEV || (process.env.DEV = false)

const port = process.env.PORT ? process.env.PORT : 3000
process.env.ELECTRON_START_URL = `http://localhost:${port}`

// Spin up the express backend as a **side effect**
// TODO: Remove this import, and run node in child process, like react-start below
const { videoAPI } = require('./videoAPI.js')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // Start React
  // const startUrl = process.env.ELECTRON_START_URL || url.format({
  //     pathname: path.join(__dirname, '/public/index.html'),
  //     protocol: 'file:',
  //     slashes: true
  // })

  mainWindow.loadURL(
		isDev
			? process.env.ELECTRON_START_URL
			: `file://${path.join(__dirname, '../build/index.html')}`,
	)

  // and load the index.html of the app.
  // mainWindow.loadURL(process.env.ELECTRON_START_URL)

  // Open the DevTools.
  isDev && mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow)
const net = require('net')
const child_process = require('child_process')
const client = new net.Socket()
let createdWindow = false
let childProcess

const tryConnection = () => client.connect({port: port}, () => {
  // 'connect' listener
  console.log('connection success')
  if (!createdWindow) {
    createWindow()
    createdWindow = true
  }
  client.end()
})

client.on('error', (error) => {
  console.log('connection error')
  if (!childProcess) {
    // TODO: Replace this with the static build version
    console.log('running npm run react-start')

    // Start with color env option because stdio is not a terminal
    // childProcess = child_process.spawn('npm', ['run', 'react-start'], {
    childProcess = child_process.spawn('npx', ['react-scripts', 'start'], {
      cwd: path.join(__dirname, '..'),
      env: Object.assign(process.env, {FORCE_COLOR: true}),
    })

    // Remove CLI clear codes
    childProcess.stdout.on('data', (data) => {
      let string = String(data)
      console.log(string.replace(/\\033\[2J/g, ''))
    })
  }
  console.log('trying connection again')
  setTimeout(tryConnection, 2500)
})

app.on('ready', () => {isDev ? tryConnection() : createWindow()})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', function () {
  // test only would kill if electron started it
  // if (!childProcess) {}

  // Use 'npm stop' because the child process will not stop its children
  // this uses 'pkill -f start.js' under the hood
  child_process.spawn('npm', ['stop'], {stdio: [process.stdin, process.stdout, process.stderr]})

  // other cleanup--react is a really messy process
  child_process.spawn('pkill', ['-f', 'open -W http://localhost:3000/'], {stdio: [process.stdin, process.stdout, process.stderr]})

  // console.log('killing child ' + childProcess.pid)
  // childProcess.kill('SIGKILL', (error) => {
  //   if (!!error) {
  //     console.log('ERROR killing child ' + error)
  //
  //     child_process.spawn('npm', ['stop'], {stdio: [process.stdin, process.stdout, process.stderr]})
  //   }
  // })
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
