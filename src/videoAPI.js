////////
// Video API / Backend
////////
// write the GET command to convert a file
// Spawn convert process
// return the file when it completes
// let the client know that it is processing
// ask client to check again? or wait?
// test the command on the right
// allow client to ask for thumbnail 'grid'...

const fs = require('fs');
const youtubedl = require('youtube-dl')

// Express info: https://expressjs.com/en/starter/faq.html
const express = require('express')
// const app = express()
const app = module.exports = express();
const port = 3080

// Express body is undefined without a middleware
// Warning: CLIENT MUST SET Content-Type header. Body will be an empty object ({})
// if there was no body to parse, the Content-Type was not matched, or an error
const bodyParser = require('body-parser')
// const multer = require('multer'); // v1.0.5
// const upload = multer(); // for parsing multipart/form-data

// The purpose of express is to handle routes.
// It doesn't do much more than manually handling the 'response' object in node.
// Express gives syntactic sugar around HTTP methods (GET), route path (/user/1),
// and route paths as parameters ('user/:userID' -> userID: 1).
// It also decodes query strings (?userID=1) and HTTP headers (x-user-id: 1)
// but those things are one-liners in node anyway.
////
// In regards to getting super fancy with route handlers,
// the route-map example is potentially an elegant declarative (data-based)
// approach, but it's not built into express, and the example map function given
// needs more work implementing.

////
// React provides its own server for rapid development, but when compiled
// for production, express can staticly serve the build folder files.

// Catch-all middleware for static files in this folder
// app.use(express.static('public'))

// Although frontend will be precompiled by react, express may be interested
// in the frontend requests for preemptive caching and logging purposes.
// app.get('/', site.index)


/**
 * Fast UUID generator, RFC4122 version 4 compliant.
 * @author Jeff Ward (jcward.com).
 * @license MIT license
 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
 **/
const uuidgen = () => {
  let lut = []
  for (let i=0; i<256; i++) {
    lut[i] = (i<16?'0':'')+(i).toString(16);
  }
  let d0 = Math.random()*0xffffffff|0;
  let d1 = Math.random()*0xffffffff|0;
  let d2 = Math.random()*0xffffffff|0;
  let d3 = Math.random()*0xffffffff|0;
  return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
    lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
    lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
    lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
}


//// API

// Storage directories
const videoDir = __dirname + '/public/videos/'
console.log('videoDir: '+ videoDir);

// Make video directory
if (!fs.existsSync(videoDir)){
  console.log('Creating dir ' + videoDir);
  fs.mkdirSync(videoDir, { recursive: true });
}

const thumbnailDir = __dirname + '/public/thumbnails/'

// maybe store under videoID
const gifDir = __dirname + '/public/gifs/'
const frameCacheDir = __dirname + '/public/frameCache/'

const videoDatabaseFile = __dirname + '/videoDatabase.json'
const gifDatabaseFile = __dirname + '/gifDatabase.json'


// Database classes
class VideoItem {
  constructor(videoID, url, title, filename, thumbnailFile) {
    this.videoID = videoID
    this.url = url
    this.title = title
    this.filename = filename
    this.thumbnailFile = thumbnailFile
  }
}

class GifItem {
  constructor(videoID, name, filename, settings) {
    this.videoID = videoID
    this.name = name
    this.filename = filename
    this.settings = settings
  }
}

class GifSettings {
  constructor(width, loop, fps, bounce) {
    this.width = width
    this.loop = loop
    this.fps = fps
    this.bounce = bounce
  }
}

class Database {
  constructor(name, databaseFile) {
    this.name = name
    this.databaseFile = databaseFile
    // could name this: data, store, all, items, allItems
    // want to reduce name collisions and confusion during syntax highlighting
    this.databaseStore = []

    // restore database from disk
    this.restoreFromDisk()
  }

  restoreFromDisk() {
    if (fs.existsSync(this.databaseFile)) {
      this.databaseStore = JSON.parse(fs.readFileSync(this.databaseFile))

      console.log('Database ' + this.name + ' read from ' + this.databaseFile);
    }
  }

  saveToDisk() {
    fs.writeFile(this.databaseFile, JSON.stringify(this.databaseStore), (err) => {
      // if (err) throw err;
      if (err) console.error(err);

      console.log('Database written to ' + this.databaseFile);
    });
  }

  findByKey(keyName, value) {
    for(let item of this.databaseStore){
      if(item[keyName] === value) return item
    }
  }

  add(item) {
    this.databaseStore.unshift(item)

    // Save database to disk
    this.saveToDisk()
  }
}

////
// Initialize database
////

const videoDatabase = new Database('Videos', videoDatabaseFile)
const downloadQueue = []


////
// Route functions
////

// This is a tad more than a plain GET request because I don't want to expose
// filenames and paths to the user
const sendVideoFile = (req, res) => {
  console.log('videoID: ' + req.params.videoID)

  // Get video filename out of database
  let videoItem = videoDatabase.findByKey('videoID', req.params.videoID)

  if (!!videoItem) {
    let videoPath = videoDir + videoItem.filename

    // check for video file
    if (fs.existsSync(videoPath)) {
      // File sent
      res.sendFile(videoPath)
      return
    }
  }
  ////
  // Fall through
  ////

  // File does not exist
  res.sendStatus(404)
  return
}

const sendVideoList = (req, res) => {
  console.log('sending database JSON')
  res.json(videoDatabase.databaseStore)
  return
}

const downloadFromURL = (req, res) => {
  console.log('body: ' + JSON.stringify(req.body));
  // URL error
  if (!req.body.url) {
    console.log('url not found');
    res.sendStatus(400)
    return
  }

  // youtube-dl
  const video = youtubedl(req.body.url,
    // Optional arguments passed to youtube-dl.
    ['--format=18'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname }
  )

  // info available to the callbacks in this execution context
  const videoDownload = {
    'video': video,
    'position': 0,
    'size': 0,
    'progress': 0
  }

  youtubedl.getThumbs(req.body.url, { all: false, cwd: __dirname }, function(err, files) {
    // if (err) throw err;
    if (err) console.error(err);

    console.log('thumbnail file downloaded:', files);
  });

  // Will be called when the download starts.
  video.on('info', function(info) {
    // Send this to the user UI
    console.log('Download started');
    console.log('filename: ' + info._filename);
    console.log('size: ' + info.size);

    videoDownload.size = info.size;

    let videoID = uuidgen()
    console.log('videoID: ' + videoID)
    console.log('filename: ' + info._filename)

    // Add to video database
    videoDatabase.add(new VideoItem(videoID, req.body.url, info._title, info._filename))

    // Add to global download queue for other requests / execution contexts
    videoDownload.videoID = videoID
    downloadQueue.push(videoDownload)
    console.log('downloadQueue: ' + JSON.stringify(downloadQueue))

    // URL accepted, processing
    res.status(202)

    // TODO: Return thumbnail and title to client
    console.log('thumbnail: ' + info.thumbnail)
    console.log('title: ' + info.title)

    res.json({
      'videoID': videoID,
      'thumbnail': info.thumbnail,
      'title': info.title
    })
    return
  });

  //
  // TODO: This does not seem to be working--is pipe call correct?
  // Maybe manually check collision filenames / URL

  // Will be called if download already exists
  video.on('complete', function complete(info) {
    console.log('filename: ' + info._filename + ' already downloaded.');

    // find videoID in database
    let videoItem = videoDatabase.findByKey('filename', info._filename)

    // Note: req.path does not always contain the full matched route
    // for example, middleware path is only the path after the matched route
    // TODO: replace :videoID ???
    res.setHeader('Location', `${req.route.path}/${videoItem.videoID}`)
    // File Exists, redirect (302 is the redirect equivalent of 202)
    // 303 means use GET to continue, and 307 means reuse the same request method.
    res.sendStatus(303)
    return
  });

  // video size is set in the info promise
  video.on('data', function data(chunk) {
    videoDownload.position += chunk.length;
    // video size should not be 0 here.
    if (videoDownload.size) {
      videoDownload.progress = (videoDownload.position / videoDownload.size * 100).toFixed(2);
      process.stdout.cursorTo(0);
      process.stdout.clearLine(1);
      process.stdout.write(videoDownload.progress + '%');
    }
  });

  video.on('end', function() {
    console.log('finished downloading!');

    // TODO: Test if this is the right pipe location
    // Also add to database here?

    // save video file
    video.pipe(fs.createWriteStream(videoDir + videoDownload.filename));

    // remove from downloadQueue
    // downloadQueue = downloadQueue.filter((item) => item.video !== video)
    downloadQueue = downloadQueue.filter((item) => item !== videoDownload)
    console.log('downloadQueue: ' + JSON.stringify(downloadQueue))

    // Start frame caching
  });

  video.on('error', function error(err) {
    console.log('youtube-dl error: ', err);

    // TODO: Is this necessary here?
    // remove from downloadQueue
    // downloadQueue = downloadQueue.filter((item) => item.video !== video)
    downloadQueue = downloadQueue.filter((item) => item !== videoDownload)
    console.log('downloadQueue: ' + JSON.stringify(downloadQueue))

    // Downloader error
    res.sendStatus(500)
    return
  });
}

  // Makes a network call for info?
  // youtubedl.getInfo(req.body.url, [], function(err, info) {
  //   if (err) return;
  //
  //   console.log('id:', info.id);
  //   console.log('title:', info.title);
  //   console.log('url:', info.url);
  //   console.log('thumbnail:', info.thumbnail);
  //   console.log('description:', info.description);
  //   console.log('filename:', info._filename);
  //   console.log('format id:', info.format_id);
  // });

// Possibility of simultaneous downloads
const downloadProgress = (req, res) => {
  // 102 would mean that no information is available. it also may be WebDAV only
  // OK, return progress percent
  res.status(200)

  res.json(JSON.stringify(downloadQueue))
  return
}

// I decided that a specific GET API for an individual item is a frontend scope,
// and is totally satisfied by the GET collection downloadProgress
// i.e. the frontend can sort and display the data itself
// const downloadProgressItem = (req, res) => {}

const deleteVideoFile = (req, res) => {
  console.log('videoID: ' + req.params.videoID);

  // check video file in database

  // delete thumbnail

  // delete from database


  // File does not exist
  res.sendStatus(404)

  // File deleted
  // res.sendStatus(200)
}



////
// Express route matching
////

// Download a file from the server to the client
app.get('/video/download', sendVideoList)
app.get('/video/download/progress', downloadProgress)
app.get('/video/download/:videoID', sendVideoFile)

// These can be set for individual routes
// Only matches header Content-Type: application/json
// app.use(bodyParser.json()); // for parsing application/json
// Only matches header Content-Type: application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Note: Only parses body when header Content-Type: application/json
app.post('/video/download', bodyParser.json(), downloadFromURL)

app.delete('/video/download/:videoID', deleteVideoFile)

// Catch-all middleware, lexcially placed after all other routes
// Note that regex is hard and express 4 does it incorrectly
// See: https://github.com/expressjs/express/issues/2495
// app.get('*', function (req, res) {
//   res.redirect('/')
// })
// app.use(function(req, res){
//   res.sendStatus(404)
// })

////
// Initialize express
////

app.listen(port, () => console.log(`Express app listening on port ${port}!`))

////
// Export this as a module for use inside an Electron app
// This syntax is from the browser imports implementation:
// export { app }

// Node 'require' syntax (so far is the only closest thing). ES6 imports is not
// yet implemented. The experimental feature flag does not work the same as the
// browser implementation, and is in the process of being completely replaced.
// Docs: https://nodejs.org/api/esm.html
// Node.js Foundation Modules Team Plan: https://github.com/nodejs/modules/blob/master/doc/plan-for-new-modules-implementation.md
// Describing article: http://2ality.com/2018/12/nodejs-esm-phases.html

// A more concise version to export when initializing the variable is at the top
// module.exports = app
// This is a little bit verbose (have to write variable name twice)
// exports.app = app
