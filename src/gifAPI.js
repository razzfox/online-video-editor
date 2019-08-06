const fs = require('fs-extra')
const path = require('path')

const database = require('./database.js')

const ffmpeg = require('fluent-ffmpeg')

const express = require('express')

// This api will add routes to the videoAPI express object
const router = module.exports = express.Router()

console.log('Starting GIF API')

// Process Current Working Directory
// const __processDir = path.dirname(process.mainModule.filename)
// console.log('__processDir: ' + __processDir)
// console.log('__dirname: ' + __dirname)

////
// API
////

const publicLocation = path.join(__dirname, '..', 'public')
const videoDir = path.join(publicLocation, 'videos')

const gifDir = path.join(publicLocation, 'gifs')
const gifCacheDir = path.join(publicLocation, 'gifCache')
const frameCacheDir = path.join(publicLocation, 'frames')
const gifDatabaseFile = path.join(__dirname, '..', 'gifDatabase.json')
const metadataDatabaseFile = path.join(__dirname, '..', 'metadataDatabase.json')

// initialize storage
database.makeStorageDirs(gifDir, frameCacheDir)
const gifDatabase = new database.Database('GIFs', gifDatabaseFile)
const metadataDatabase = new database.Database('Metadata', metadataDatabaseFile)

let videoRequestQueue = []


const getVideoInfo = (req, res) => {
  console.log('videoID: ' + req.params.videoID)
  
  let videoMetadata = metadataDatabase.get(req.params.videoID)
  if(videoMetadata){
    console.dir(videoMetadata)
    res.status(200).json(videoMetadata).end()
    return
  }

  // Get video out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.get(req.params.videoID)

  if(videoItem){
    let videoPath = path.join(videoDir, videoItem.filename)
    console.log('videoPath: ' + JSON.stringify(videoPath))

    if (fs.existsSync(videoPath)) {
      let process = ffmpeg(videoPath)
        .ffprobe((error, metadata) => {
          if (error) console.error(error)

          // videoItem.metadata = metadata
          // videoDatabase.saveToDisk()
          metadata.id = videoItem.id
          metadataDatabase.add(metadata)
          // metadataDatabase.add({id: videoItem.id, ...metadata})
          metadataDatabase.saveToDisk()

          console.dir(metadata)
          res.status(200).json(metadata).end()
          return
        })
      }
  } else {
    // Not found
    res.sendStatus(404).end()
    return
  }
  ////
  // Responses are generated inside ffmpeg callbacks
  ////
  return
}

// TODO: Can FFMPEG merge GIFs?
const mergeGIFs = gifFilenames => {
  // create child process
  // convert 1.gif 2.gif out.gif
  return
}

// Kill ffmpeg after 60 seconds anyway
// setTimeout(function() {
//   command.on('error', function() {
//     console.log('Ffmpeg has been killed');
//   });
//
//   command.kill();
// }, 60000);

const checkBodyForErrors = (req, res) => {
  // Bad Content-Type
  if(req.headers['content-type'] !== 'application/json') {
    let error = 'Content-Type not JSON'
    console.error(error)
    res.status(400).send(error).end()
    return
  }

  // TODO: Check for valid GIFSettings
}

const putVideoToGIF = (req, res) => {
  checkBodyForErrors(req, res)

  let gifRequest = req.body
  console.log('videoID: ' + gifRequest.id)

  // Get video out of database
  let videoDatabase = res.locals.videoDatabase
  // let videoItem = videoDatabase.get(gifRequest.videoID)
  let videoItem = videoDatabase.get(gifRequest.id)

  if(!videoItem) {
    // Not Found
    res.sendStatus(404).end()
    return
  }

  let videoPath = path.join(videoDir, videoItem.filename)

  let gifSettings = new database.GIFSettings(gifRequest.start, gifRequest.length, gifRequest.options)
  let gifSettingsJSON = JSON.stringify(gifSettings)
  console.log('GIFSettings: ' + gifSettingsJSON)

  // Since there are going to be so many gifs used for previews, we need UUIDs
  let gifItem = new database.GIFItem(videoItem.id, videoItem.title, path.parse(videoItem.filename).name, gifSettings)

  // Verify that no gif already in the database matches requested settings
  let gifsUsingVideoID = gifDatabase.findItemsByKey('videoID', videoItem.id)
  let matchingGIFSettings = gifsUsingVideoID.find(item => JSON.stringify(item.gifSettings) === gifSettingsJSON)
  if(!matchingGIFSettings) {
    let gifPath = path.join(gifDir, gifItem.filename)
    // Note: seek is relative, so it can be called multiple times and video gets
    // decoded while seeking, but seekInput sets the start point, and skips decoding
    let process = ffmpeg(videoPath)
      .output(gifPath)
      .seekInput(gifSettings.start)
      .duration(gifSettings.length)
      .size(gifSettings.width)

      .on('start', () => {
        console.time('ffmpeg-' + gifItem.filename)

        console.log('starting GIF conversion')
        // res.status(201).json(gifItem).end()
        // return
      })
      // .on('progress', (progress) => {
      //   console.log(progress);
      // })
      .on('end', () => {
        console.timeEnd('ffmpeg-' + gifItem.filename)

        // add to database
        gifDatabase.add(gifItem)

        res.status(201).json(gifItem).end()
        return
      })
      .on('error', (error, stdout, stderr) => {
        console.error(error)
        // Warning: you should always set a handler for the error event, as node's default behaviour when an error event without any listeners is emitted is to output the error to the console and terminate the program.
        if(!res.headersSent) res.status(500).json(error).end()
        return
      })
      .renice(5)
      .run()
      // auto-include boomerang version
      // provide multiple file sizes (and gifv)
  } else {
    // existing GIF found
    let gifRoute = path.join(req.route.path, matchingGIFSettings.id)
    console.log('Redirect client to: ' + gifRoute);

    res.setHeader('Location', gifRoute)
    // File Exists, redirect (302 is the redirect equivalent of 202)
    // 303 means use GET to continue, and 307 means reuse the same request method.
    res.sendStatus(303).end()
    return
  }
  ////
  // Responses are generated inside ffmpeg callbacks
  ////
  return
}

const getGIFList = (req, res) => {
  console.log('sending database JSON')
  res.json(gifDatabase.all())
}

const getGIFInfo = (req, res) => {
  console.log('gifID: ' + req.params.gifID)

  // Get gif out of database
  let gifItem = gifDatabase.get(req.params.gifID)

  if (!!gifItem) {
    res.status(200).json(gifItem).end()
    return
  }
  ////
  // Fall through
  ////

  // Not found
  res.sendStatus(404).end()
}

// TODO: How to delete gifCache and frameCache on deletion?

const deleteGIF = (req, res) => {
  console.log('gifID: ' + req.params.gifID)

  // Get gif out of database
  let gifItem = gifDatabase.get(req.params.gifID)

  if (!!gifItem) {
    // This is not in the database so that it is hidden from the user
    let gifPath = path.join(gifDir, gifItem.filename)

    // delete file
    database.deleteFiles(gifPath)

    // remove from database
    gifDatabase.remove(gifItem)

    res.sendStatus(200).end()
    return
  }
  ////
  // Fall through
  ////

  // Not found in database
  res.sendStatus(404).end()
}

const postGIFCache = (req, res) => {
  console.log('videoID: ' + req.params.videoID)
  
  // Get video out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.get(req.params.videoID)

  if(!videoItem) {
    // Not Found
    res.sendStatus(404).end()
    return
  }

  // This is not in the database so that it is hidden from the user
  let videoPath = path.join(videoDir, videoItem.filename)
  let gifCache = path.join(gifCacheDir, videoItem.id)

  if (fs.existsSync(videoPath)) {
    // if cache folder does not exist, create it
    if (!fs.existsSync(gifCache)) {
      // make storage dir
      database.makeStorageDirs(gifCache)
    }
  }

  let videoMetadata = metadataDatabase.get(req.params.videoID)  
  if(videoMetadata && videoMetadata.format.duration) {
    console.time('ffmpeg-screenshots')

    let process = ffmpeg(videoPath)
    // process.noAudio()
    for (let index = 0; index < videoMetadata.format.duration; index++) {
      process.seekInput(index)
      process.duration(1)
      process.output(`${gifCache}/${index}.gif`)
    }
    // process.on('progress', (progress) => {
    //   console.log(progress);
    // })
    process.on('error', error => {
      console.error(error)
    })
    process.on('end', () => {
      console.timeEnd('ffmpeg-screenshots')
      console.log('Processing finished!')

      res.status(201).end()
      return
    })
    process.renice(5)
    process.run()
  }
  
  ////
  // Responses are generated inside ffmpeg callbacks
  ////
  return
}

// TODO: Implement a count and a basic 'new' parameter
// TODO: Does ffmpeg skip files that aready exist?
// I dont think so, I will have to check for each before starting ffmpeg
const postFrameCache = (req, res) => {
  console.log('videoID: ' + req.params.videoID)

  // Get video out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.get(req.params.videoID)

  if(!videoItem) {
    // Not Found
    res.sendStatus(404).end()
    return
  }

  let videoPath = path.join(videoDir, videoItem.filename)  

  if (fs.existsSync(videoPath)) {
    let videoFrameCache = path.join(frameCacheDir, videoItem.id)

    // if cache folder exists, return filenames
    if (fs.existsSync(videoFrameCache)) {
      console.log('Listing directory ' + videoFrameCache)
      res.status(200).json(fs.readdirSync(videoFrameCache)).end()
      return
    }

    // make storage dir
    database.makeStorageDirs(videoFrameCache)

    let process = ffmpeg(videoPath)
      .on('filenames', (filenames) => {
        console.time('ffmpeg-screenshots')

        res.status(201).json(filenames).end()
        return
      })
      // .on('progress', (progress) => {
      //   console.log(progress);
      // })
      .on('end', () => {
        console.timeEnd('ffmpeg-screenshots')

        console.log('Frames finished exporting')

        // GIF cache
        // console.log('starting GIF cache')
        // gifCache(videoPath)
      })
      .on('error', (error, stdout, stderr) => {
        console.error(error)
        // Warning: you should always set a handler for the error event, as node's default behaviour when an error event without any listeners is emitted is to output the error to the console and terminate the program.
        if(!res.headersSent) res.status(500).json(error).end()
        return
      })
      .renice(5)
      .screenshots({
        filename: 'frame%s.bmp',
        size: '100x?',
        // timestamps: [30.5, '50%', '01:10.123'],
        // count = 4 will take screens at 20%, 40%, 60% and 80% of the video
        count: 4,
        folder: videoFrameCache,
      })
    ////
    // Responses are generated inside ffmpeg callbacks
    ////
    return
  }
  ////
  // Fall through
  ////

  // Not found
  res.sendStatus(404).end()
}

const cancelIfVideoIDSame = (req, res) => {
  console.log('videoRequestQueue length', videoRequestQueue.length)
  if(videoRequestQueue.length > 0 ) {
    let sameVideoID = videoRequestQueue.find((item) => item.videoItem.id === req.params.videoID)
    if(!!sameVideoID) {
      sameVideoID.process.kill()
      videoRequestQueue = videoRequestQueue.filter((item) => item.process !== sameVideoID.process)
    }
  }
}

const getVideoFrame = (req, res) => {
  // cancelIfVideoIDSame(req, res)

  console.log('videoID: ' + req.params.videoID)
  console.log('frameStartTime: ' + req.params.frameStartTime)

  let frameStartTime = req.params.frameStartTime
  
  // Get video out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.get(req.params.videoID)

  if(!videoItem) {
    // Not Found
    res.sendStatus(404).end()
    return
  }

  // Bad Request
  let videoMetadata = metadataDatabase.get(req.params.videoID)  
  if(frameStartTime < 0 || (videoMetadata && frameStartTime > videoMetadata.format.duration) ) {
  // if(frameStartTime < 0) {
    let error = 'Frame Start Time is out of video range: ' + frameStartTime
    console.error(error)
    res.status(400).send(error).end()
    return
  }

  // This is not in the database so that it is hidden from the user
  let videoPath = path.join(videoDir, videoItem.filename)
  let videoFrameCache = path.join(frameCacheDir, videoItem.id)

  if (fs.existsSync(videoPath)) {
    // if cache folder does not exist, create it
    if (!fs.existsSync(videoFrameCache)) {
      // make storage dir
      database.makeStorageDirs(videoFrameCache)
    }

    // if frame exists, send it
    let frameFilename = `frame${frameStartTime}.bmp`
    let frameFilenamePath = path.join(videoFrameCache, frameFilename)
    if (fs.existsSync(frameFilenamePath)) {
      // this is asynchronous, so do not call res.end()
      // respond with requested frame
      res.setHeader('Content-Disposition', `inline; filename="${frameFilename}"`)
      // Note: sendFile's cacheControl and maxAge options only work if the cache-control header has not been set
      // so it is more reliable to overwrite it without checking
      res.setHeader("Cache-Control", `public, max-age=${res.locals.maxAgeSeconds}`)
      res.status(200).sendFile(frameFilenamePath)
      console.log('content-type', res.get('Content-Type'))
      return
    }

    // use var to hoist process to access it in the callback
    // using let worked on macOS Node, but not on Android/Linux Node
    var process = ffmpeg(videoPath)
      .on('filenames', (filenames) => {
        console.time(frameFilenamePath)

        if(filenames[0] !== frameFilename) {
          console.warn(`${filenames[0]} !== ${frameFilename}`)
        }

        // add to progress queue
        let videoRequestItem = {
          process,
          videoItem,
        }
        videoRequestQueue.push(videoRequestItem)

        // console.log('Will generate ' + filenames.join(', '))
        // res.status(201).json(filenames).end()
        // return
      })
      // .on('progress', (progress) => {
      //   console.log(progress);
      // })
      .on('end', () => {
        console.timeEnd(frameFilenamePath)

        // remove from progress queue
        videoRequestQueue = videoRequestQueue.filter((item) => item.process !== process)

        // respond with requested frame (support for only one) (
        // this is asynchronous, so do not call res.end()
        res.setHeader('Content-Disposition', `inline; filename="${frameFilename}"`)

        // Note: sendFile's cacheControl and maxAge options only work if the cache-control header has not been set
        // so it is more reliable to overwrite it without checking
        res.setHeader("Cache-Control", `public, max-age=${res.locals.maxAgeSeconds}`)
        res.status(201).sendFile(frameFilenamePath)
        return
      })
      .on('error', (error, stdout, stderr) => {
        console.error(error)
        // Warning: you should always set a handler for the error event, as node's default behaviour when an error event without any listeners is emitted is to output the error to the console and terminate the program.
        if(!res.headersSent) res.status(500).json(error).end()
        return
      })
      .renice(-5) // high priority
      .screenshots({
        // filename: 'frame%s.bmp',
        filename: frameFilename,
        size: '100x?',
        // timestamps: [30.5, '50%', '01:10.123'],
        timestamps: [frameStartTime],
        // count = 4 will take screens at 20%, 40%, 60% and 80% of the video
        folder: videoFrameCache,
      })
    ////
    // Responses are generated inside ffmpeg callbacks
    ////
    return
  }
  ////
  // Fall through
  ////
  console.log('Video not found')
  // File does not exist
  res.sendStatus(404).end()
  return
}


const deleteFrameCache = (req, res) => {
  console.log('videoID: ' + req.params.videoID)
  let videoFrameCache = path.join(frameCacheDir, req.params.videoID)

  // if cache folder exists, delete all files inside
  if (fs.existsSync(videoFrameCache)) {
    console.log('Removing directory ' + videoFrameCache)

    try {
      fs.removeSync(videoFrameCache)
    } catch (error) {
      console.error(error)
      res.sendStatus(500).end()
      return
    }

    console.log('success!')
    res.sendStatus(200).end()
    return
  }
  ////
  // Fall through
  ////

  // Not found
  res.sendStatus(404).end()
}

// TODO: Repair
const repairGIFList = (req, res) => {
  // remove gif datbase items without existing files (or recreate the gifs?)

  // enumerate all gif files that do not have a database item

  // recreate the database items for the orphan files
  // match the filename/title to the video filename
}

// TODO: make a delete trash. This is important because people will be testing it


// a middleware with no mount path; gets executed for every request to the app
// router.use(function (req, res, next) {
//   next()
// })

// analyze video info (length, fps, size)
router.get('/videos/:videoID/info', getVideoInfo)

// Reminder: Body only parses when header Content-Type: application/json
// convert video to gif
router.put('/gifs', putVideoToGIF)

// get all gifs as array
router.get('/gifs', getGIFList)

// download gif file
// this can be handled by the public directory
// router.get('/gifs/:gifID', getGIFFile)

// get gif info
router.get('/gifs/:gifID', getGIFInfo)

// get all gifs from videoID
// (data sorting needs to be done on the frontend)

// delete gif
router.delete('/gifs/:gifID', deleteGIF)

// provide frame cache state on post (not get)
// This is because the action may cause new files to be created
//
// include low-q gif cache
// select video file / edit video again -> return frame cache
router.post('/frames/:videoID', postFrameCache)

// delete frame cache
router.delete('/frames/:videoID', deleteFrameCache)

// get frame at time in seconds
router.get('/frames/:videoID/:frameStartTime', getVideoFrame)

// TODO: animated grid
router.post('/gifcache/:videoID', postGIFCache)
// router.delete('/gifcache/:videoID', deleteGIFCache)
