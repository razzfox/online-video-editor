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
const frameCacheDir = path.join(publicLocation, 'frameCache')
const gifDatabaseFile = path.join(__dirname, '..', 'gifDatabase.json')

// initialize storage
database.makeStorageDirs(gifDir, frameCacheDir)
const gifDatabase = new database.Database('GIFs', gifDatabaseFile)

let videoRequestQueue = []


const getVideoInfo = (req, res) => {
  console.log('videoID: ' + req.params.videoID)  

  // Get filename out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.findItemsByKey('videoID', req.params.videoID)[0]
  
  // TODO: create a function that checks for the target in database and filesystem
  if(!!videoItem){
    let videoPath = path.join(videoDir, videoItem.filename)
    console.log('videoPath: ' + JSON.stringify(videoPath))

    if (fs.existsSync(videoPath)) {
      let process = ffmpeg(videoPath)
        .ffprobe((err, metadata) => {
          if (err) console.error(err)

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
const mergeGIFs = (gifFilenames) => {
  ffmpeg('/path/to/part1.avi')
    .input('/path/to/part2.avi')
    .input('/path/to/part2.avi')
    .on('error', (err) => {
      console.error('An error occurred: ' + err.message);
    })
    .on('end', () => {
      console.log('Merging finished !');
    })
    // .on('progress', (progress) => {
    //   console.log(progress);
    // })
    .mergeToFile('/path/to/merged.avi', '/path/to/tempDir')

    ////
    // Responses are generated inside ffmpeg callbacks
    ////
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
  console.log('videoID: ' + gifRequest.videoID)  

  // Get filename out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.findItemsByKey('videoID', gifRequest.videoID)[0]

  let videoPath = path.join(videoDir, videoItem.filename)

  let gifSettings = new database.GIFSettings(gifRequest.start, gifRequest.length, gifRequest.options)
  let gifSettingsJSON = JSON.stringify(gifSettings)
  console.log('GIFSettings: ' + gifSettingsJSON)

  // Since there are going to be so many gifs used for previews, we need UUIDs
  let gifItem = new database.GIFItem(videoItem.videoID, videoItem.title, path.parse(videoItem.filename).name, gifSettings)

  // Verify that no gif already in the database matches requested settings
  let gifsUsingVideoID = gifDatabase.findItemsByKey('videoID', videoItem.videoID)
  if(!gifsUsingVideoID.some(item => JSON.stringify(item.gifSettings) === gifSettingsJSON)) {
    let gifPath = path.join(gifDir, gifItem.filename)
    // Note: seek is relative, so it can be called multiple times and video gets
    // decoded while seeking, but seekInput sets the start point, and skips decoding
    let process = ffmpeg(videoPath)
      .output(gifPath)
      .seekInput(gifSettings.start)
      .duration(gifSettings.length)

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
      .on('error', (err, stdout, stderr) => {
        console.error('Cannot process video: ' + err.message)
        // Warning: you should always set a handler for the error event, as node's default behaviour when an error event without any listeners is emitted is to output the error to the console and terminate the program.
        if(!res.headersSent) res.status(500).json(err.message).end()
        return
      })
      .renice(5)
      .run()
      // auto-include boomerang version
      // provide multiple file sizes (and gifv)
  } else {
    // existing GIF found
    let gifRoute = path.join(req.route.path, videoItem.videoID)
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
  res.json(gifDatabase.databaseStore)
}

const getGIFInfo = (req, res) => {
  let gifID = req.params.gifID

  console.log('gifID: ' + gifID)

  let gifItem = gifDatabase.findItemsByKey('gifID', gifID)[0]
  if (!!gifItem) {
    res.status(200).json(gifItem).end()
    return
  }
  ////
  // Fall through
  ////

  // Not found
  res.sendStatus(404)
}

// TODO: How to delete gifCache and frameCache on deletion?

const deleteGIF = (req, res) => {
  console.log('gifID: ' + req.params.gifID)

  // Get filename out of database
  let gifItem = gifDatabase.findItemsByKey('gifID', req.params.gifID)[0]

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

const gifCache = (videoPath) => {
  // TODO: does .noAudio() have any impact?
  ffmpeg(videoPath)
  .seekInput('1:00')

  .output('1.gif')
  .seek('1:00')
  .duration(1)

  .output('2.gif')
  .seek('1:00')
  .duration(1)

  .output('3.gif')
  .seek('1:00')
  .duration(1)

  // .on('progress', (progress) => {
  //   console.log(progress);
  // })
  .on('error', (err) => {
    console.error('An error occurred: ' + err.message);
  })
  .on('end', () => {
    console.log('Processing finished !');
  })
  .renice(5)
  .run()
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

  // console.log(JSON.stringify(res.locals))
  // Get filename out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.findItemsByKey('videoID', req.params.videoID)[0]
  let videoPath = path.join(videoDir, videoItem.filename)  

  if (fs.existsSync(videoPath)) {
    let videoFrameCache = path.join(frameCacheDir, videoItem.videoID)

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
        console.time('ffmpeg-screenshots' + filenames.join(','))

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
        console.log('starting GIF cache')
        // gifCache(videoPath)
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Cannot process video: ' + err.message)
        // Warning: you should always set a handler for the error event, as node's default behaviour when an error event without any listeners is emitted is to output the error to the console and terminate the program.
        if(!res.headersSent) res.status(500).json(err.message).end()
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
  console.log(videoRequestQueue.length)
  if(videoRequestQueue.length > 0 ) {
    let sameVideoID = videoRequestQueue.find((item) => item.videoID === req.params.videoID)
    if(!!sameVideoID) {
      sameVideoID.process.kill()
      videoRequestQueue = videoRequestQueue.filter((item) => item.process !== sameVideoID.process)
    }
  }
}

// Note: Frame Start Time larger than video length will run ffmpeg, but not error (fall through to 404)
const getVideoFrame = (req, res) => {
  cancelIfVideoIDSame(req, res)

  console.log('videoID: ' + req.params.videoID)
  console.log('frameStartTime: ' + req.params.frameStartTime)

  let frameStartTime = req.params.frameStartTime

  // Bad Request
  if(frameStartTime < 0) {
    let error = 'Frame Start Time is negative: ' + frameStartTime
    console.error(error)
    res.status(400).send(error).end()
    return
  }

  // Get filename out of database
  let videoDatabase = res.locals.videoDatabase
  let videoItem = videoDatabase.findItemsByKey('videoID', req.params.videoID)[0]

  // This is not in the database so that it is hidden from the user
  let videoPath = path.join(videoDir, videoItem.filename)
  let videoFrameCache = path.join(frameCacheDir, videoItem.videoID)

  if (!!videoItem && fs.existsSync(videoPath)) {
    // if cache folder does not exist, create it
    if (!fs.existsSync(videoFrameCache)) {
      // make storage dir
      database.makeStorageDirs(videoFrameCache)
    }

    // if frame exists, send it
    let requestedFrame = path.join(videoFrameCache, `frame${frameStartTime}.bmp`)
    if (fs.existsSync(requestedFrame)) {
      // this is asynchronous, so do not call res.end()
      // respond with requested frame
      res.status(200).sendFile(requestedFrame)
      return
    }

    let process = ffmpeg(videoPath)
      .on('filenames', (filenames) => {
        console.time('ffmpeg-screenshots')

        if(filenames[0] !== `frame${frameStartTime}.bmp`) {
          console.warn(`filenames[0] !== frame${frameStartTime}.bmp`)
        }

        // add to progress queue
        let videoRequestItem = {
          process: process,
          videoID: req.params.videoID,
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
        console.timeEnd('ffmpeg-screenshots')

        console.log('Frames finished exporting')
        // remove from progress queue
        videoRequestQueue = videoRequestQueue.filter((item) => item.process !== process)

        // respond with requested frame (support for only one) (
        // this is asynchronous, so do not call res.end()
        res.status(201).sendFile(requestedFrame)
        return
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Cannot process video: ' + err.message)
        // Warning: you should always set a handler for the error event, as node's default behaviour when an error event without any listeners is emitted is to output the error to the console and terminate the program.
        if(!res.headersSent) res.status(500).json(err.message).end()
        return
      })
      .renice(-5) // high priority
      .screenshots({
        filename: 'frame%s.bmp',
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
    } catch (err) {
      console.error(err)
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


// a middleware with no mount path; gets executed for every request to the app
// router.use(function (req, res, next) {
//   next()
// })

// analyze video info (length, fps, size)
router.get('/videoInfo/:videoID', getVideoInfo)

// Reminder: Body only parses when header Content-Type: application/json
// convert video to gif
router.put('/gif', putVideoToGIF)

// get all gifs
router.get('/gif', getGIFList)

// download gif file
// this can be handled by the public directory
// router.get('/gif/:gifID', getGIFFile)

// get gif info
router.get('/gif/:gifID', getGIFInfo)

// get all gifs from videoID
// (data sorting needs to be done on the frontend)

// delete gif
router.delete('/gif/:gifID', deleteGIF)

// provide frame cache state on post (not get)
// This is because the action may cause new files to be created
//
// include low-q gif cache
// select video file / edit video again -> return frame cache
router.post('/frameCache/:videoID', postFrameCache)

// delete frame cache
router.delete('/frameCache/:videoID', deleteFrameCache)

// get frame at time in seconds
router.get('/frameCache/:videoID/:frameStartTime', getVideoFrame)

// TODO: animated grid
// router.post('/gifcache', postGIFCache)
// router.delete('/gifcache/:videoID', deleteGIFCache)
