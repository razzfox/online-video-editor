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

const fs = require('fs-extra')
const path = require('path')

const database = require('./database.js')

const youtubedl = require('youtube-dl')

// Express info: https://expressjs.com/en/starter/faq.html
const express = require('express')
const cors = require('cors')
// const app = express()
const app = module.exports = express()
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

console.log('Starting Video API')

// Process Current Working Directory
console.log('__dirname: ' + __dirname)


// clipAPI
const clipAPILocation = `http://localhost:${port}`
const clipAPIRoute = '/clips'
const cacheRoute = 'cache'


////
// Initialize database and storage directories
////

// Note: move up one to parent of 'src' directory; path library manages system delimiters
const publicLocation = path.join(__dirname, '..', 'public')

const videoDir = path.join(publicLocation, 'videos')
const thumbnailDir = path.join(publicLocation, 'thumbnails')
const videoDatabaseFile = path.join(__dirname, '..', 'videoDatabase.json')

// initialize storage
database.makeStorageDirs(videoDir, thumbnailDir)

const videoDatabase = new database.Database('Videos', videoDatabaseFile)
let downloadQueue = []


////
// Route functions
////

const getVideoInfo = (req, res) => {
  console.log('videoID: ' + req.params.videoID)

  // Get video out of database
  let videoItem = videoDatabase.get(req.params.videoID)

  if (!!videoItem) {
    // This is not in the database so that it is hidden from the user
    let videoPath = path.join(videoDir, videoItem.filename)

    // check for video file
    if (fs.existsSync(videoPath)) {
      console.log(JSON.stringify(videoItem))
      // Video info sent
      res.status(200).json(videoItem).end()
      return
    } else {
      console.log('Video file not found: ' + videoPath)
      // TODO: Remove from database when file is missing?
    }
  }
  ////
  // Fall through
  ////

  // File does not exist
  res.sendStatus(404).end()
  return
}

const getVideoList = (req, res) => {
  console.log('sending database JSON')
  res.json(videoDatabase.all())
}


const checkBodyForErrors = (req, res) => {
  // Bad Content-Type
  if(req.headers['content-type'] !== 'application/json') {
    let error = 'Content-Type is not application/json'
    console.error(error)
    res.status(400).send(error).end()
    return
  }

  // Bad URL
  if (!req.body.url) {
    let error = 'URL not found in body'
    console.error(error)
    res.status(400).send(error).end()
    return
  }
}

const downloadFromURL = (req, res) => {
  checkBodyForErrors(req, res)

  // Detect if video already exists
  let videoItem = videoDatabase.findItemsByKey('url', req.body.url)[0]
  if(!!videoItem && fs.existsSync(path.join(videoDir, videoItem.filename)
)) {
    console.log('filename: ' + videoItem.filename + ' already downloaded.');

    // Go to parent route / remove 'download' from path
    let videoRoute = path.join(req.route.path, '..', videoItem.id)
    console.log('Redirect client to: ' + videoRoute);

    // Note: req.path does not always contain the full matched route
    // for example, middleware path is only the path after the matched route
    res.setHeader('Location', videoRoute)
    // File Exists, redirect (302 is the redirect equivalent of 202)
    // 303 means use GET to continue, and 307 means reuse the same request method.
    res.sendStatus(303).end()
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
    'position': 0,
    'size': 0,
    'progress': 0
  }

  // Will be called when the download starts.
  video.on('info', (info) => {
    // Send this to the user UI
    console.log('Download started');
    console.log('filename: ' + info._filename);
    console.log('size: ' + info.size);

    videoDownload.size = info.size;

    // Create item that will go into database
    let videoItem = new database.VideoItem(req.body.url, info.title, info._filename)

    // Add to global download queue for other requests / execution contexts
    videoDownload.videoItem = videoItem
    downloadQueue.push(videoDownload)
    console.log('downloadQueue: ' + JSON.stringify(downloadQueue))

    // save video file
    video.pipe(fs.createWriteStream(path.join(videoDir, videoItem.filename), { flags: 'a' }))


    // TODO: Return thumbnail and title to client
    // TODO: This is a thumbnail URL, not a filename
    console.log('thumbnail: ' + info.thumbnail)
    console.log('title: ' + info.title)
    console.log('filename: ' + info._filename)

    // URL accepted, processing
    res.status(202).json(videoItem).end()
    return
  });

  // WORKAROUND: This does not seem to be working. Workaround at top of function
  // Will be called if download already exists
  // video.on('complete', (info) => {
  // });

  // video size is set in the info promise
  video.on('data', (chunk) => {
    videoDownload.position += chunk.length;
    // video size should not be 0 here.
    if (videoDownload.size) {
      videoDownload.progress = (videoDownload.position / videoDownload.size * 100).toFixed(2);
      process.stdout.write(videoDownload.progress + '%');
    }
  });

  video.on('end', () => {
    console.log('finished downloading!');

    // Note: for some reason, we can not save the video here

    // add to database
    videoDatabase.add(videoDownload.videoItem)

    // remove from downloadQueue (use execution context)
    downloadQueue = downloadQueue.filter((item) => item !== videoDownload)
    console.log('downloadQueue: ' + JSON.stringify(downloadQueue))

    // Download thumbnail and add info to database
    youtubedl.getThumbs(req.body.url, { all: false, cwd: thumbnailDir }, (error, files) => {
      if (error) console.error(error)
      console.log('thumbnail file downloaded:', files);

      // WARNING: The cwd option does not work here. Workaround to move the file
      // WARNING: Fix a really shitty problem with unicode/emoji
      let thumbnailFilename = path.parse(files[0])
      let videoFilename = path.parse(videoDownload.videoItem.filename)
      let emojiCompatibleFilename = `${videoFilename.name}${thumbnailFilename.ext}`

      try {
        fs.renameSync(emojiCompatibleFilename, path.join(thumbnailDir, emojiCompatibleFilename))
        videoDownload.videoItem.thumbnailFilename = emojiCompatibleFilename
        // save after modifying item
        videoDatabase.saveToDisk()
      } catch (error) {
        console.error(error)
      }
    })

    // TODO: Call clipAPI to begin frame cache
    // get-state, expect either processing or done, and 404 possible
  })

  video.on('error', error => {
    console.error('youtube-dl error: ', error);

    // TODO: Is this necessary here?
    // remove from downloadQueue
    // downloadQueue = downloadQueue.filter((item) => item.video !== video)
    downloadQueue = downloadQueue.filter((item) => item !== videoDownload)
    console.log('downloadQueue: ' + JSON.stringify(downloadQueue))

    // Downloader error
    if(!res.headersSent) res.status(500).send(error).end()
    return
  })
  ////
  // Responses are generated inside ffmpeg callbacks
  ////
  return
}

  // Makes a network call for info?
  // youtubedl.getInfo(req.body.url, [], (error, info) => {
  //   if (error) return;
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
const getDownloadProgress = (req, res) => {
  // 102 would mean that no information is available. it also may be WebDAV only
  // OK, return progress percent
  res.status(200).json(downloadQueue).end()
  return
}

// I decided that GET for an individual download progress item is frontend scope,
// and is totally satisfied by the GET collection getDownloadProgress
// i.e. the frontend can sort and display the data itself
// const getDownloadProgressItem = (req, res) => {}

const deleteVideoFile = (req, res) => {
  console.log('videoID: ' + req.params.videoID)

  // Get video out of database
  let videoItem = videoDatabase.get(req.params.videoID)

  if (!!videoItem) {
    try {
      // delete files
      let videoPath = path.join(videoDir, videoItem.filename)
      // Note: handrle error due to optional items (thumbnailFile)
      let thumbnailPath = path.join(thumbnailDir, videoItem.thumbnailFile) || null
      database.deleteFiles(videoPath, thumbnailPath)
    } catch (error) {}

    // remove from database
    videoDatabase.remove(videoItem)

    res.sendStatus(200).end()
    return
  } else {
    console.log('Video not found')
    // TODO: Remove from database when file is missing?
  }
  ////
  // Fall through
  ////

  // File does not exist
  res.sendStatus(404).end()
  return
}



////
// Middleware (helper functions before main logic)
////


// CORS: Cross-Origin Resource Sharing (backend is different than the frontend)
// Note: mobile apps don't have a concept of CORS (yet)
// TODO: assign a specific origin address
// const frontendOriginLocation = 'http://localhost:3000'
app.use(cors())

// Note: req.body is undefined until a middleware matches and parses it
// Client must send Content-Type
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// DEBUG: middleware that prints every request
app.use(function (req, res, next) {
  console.log(`${req.method} ${req.url}`)
  console.log('Content-Type:',req.headers['content-type'])
  console.log('body:', req.body)
  next()
})

////
// React provides its own server for rapid development, but when compiled
// for production, express can staticly serve the build folder files.

// Catch-all middleware for static files in this folder (decodes URL internally)
// Note: cacheControl and maxAge options only work if the cache-control header has not been set
// so, only set no-store in a route AFTER this one, not before.
// Note: although the spec requires max-age in seconds, the static function only accepts milliseconds.
// NOTE: to use the first directory ('/public') in the URL, it must be the first argument, otherwise it mounts on '/'
app.use(express.static(publicLocation, { cacheControl: true, maxAge: '60000' }))

// a middleware with no mount path; gets executed for every request to the app
app.use(function(req, res, next) {
  // pass videoDatabase
  // pass cache age for immutable resources, so they can be set when sent (everything else is hard no-cache)
  // 31536000s = 1yr
  res.locals = {
    videoDatabase: videoDatabase,
    maxAgeSeconds: '31536000'
  }

  // Decode URL
  // req.url = decodeURI(req.url)

  res.setHeader('charset', 'utf-8')

  // Disable all caching (HTTP 1.1) unless later enabled
  // This prevents the GET list requests from being cached
  // other APIs use POST to avoid this.
  // The opposite directive is 'max-age=<seconds>'.
  // Note: Firefox devs invented 'immutable' because they choose to ignore max-age on (soft) page reloads.
  // It is nonstandard, and it is intended to be a permanent flag.
  // The proposed way to update an immutable a resource is to use a new resource identifier.
  // That's fine when your resources use UUIDs, but not realistic when you are serving index.html and images.
  // See: https://code.fb.com/web/this-browser-tweak-saved-60-of-requests-to-facebook/
  // Warning: when Cache-Control exists, the Expires header (absolute date/time) is ignored.
  res.setHeader("Cache-Control", "no-store")

  next()
})

////
// Route matching (main app logic)
////

// Download a file from the server to the client
// Note: order matching is specific routes (download) before general (:videoID)
app.get('/videos/downloads/progress', getDownloadProgress)
// app.get('/videos/downloads/:videoID', getVideoFile)

// get all videos as array
app.get('/videos', getVideoList)
app.get('/videos/:videoID', getVideoInfo)

// These can be set for individual routes
// Only matches header Content-Type: application/json
// app.use(bodyParser.json()); // for parsing application/json
// Only matches header Content-Type: application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Note: Only parses body when header Content-Type: application/json
app.post('/videos/downloads', downloadFromURL)

app.delete('/videos/:videoID', deleteVideoFile)

// Catch-all middleware, lexcially placed after all other routes
// Note: regex is hard and express 4 does it incorrectly
// See: https://github.com/expressjs/express/issues/2495
// app.get('*', function (req, res) {
//   res.redirect('/')
// })
// app.use(function(req, res){
//   res.sendStatus(404).end()
// })

////
// Initialize express
////

// clipAPI exports a router for this express instance
const clipAPI = require('./clipAPI.js')
app.use('/', clipAPI);


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
