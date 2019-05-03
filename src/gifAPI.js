const fs = require('fs')
const path = require('path')

const database = require('./database.js')

const ffmpeg = require('fluent-ffmpeg')
const ffmpeg_extract_frames = require('ffmpeg-extract-frames')

const express = require('express')

// This api will add routes to the videoAPI express object
const router = module.exports = express.Router()

console.log('Starting GIF API');

// Process Current Working Directory
const __processDir = path.dirname(process.mainModule.filename)
console.log('__processDir: ' + __processDir);
console.log('__dirname: ' + __dirname);

////
// API
////

const videoDir = path.join(__dirname, '..', '/public/videos/')

const gifDir = path.join(__dirname, '..', '/public/gifs/')
const frameCacheDir = path.join(__dirname, '..', '/public/frameCache/')
const gifDatabaseFile = path.join(__dirname, '..', '/gifDatabase.json')

// initialize storage
database.makeStorageDirs(gifDir, frameCacheDir)
const gifDatabase = new database.Database('GIFs', gifDatabaseFile)


const checkBodyForErrors = (req, res) => {
  // Bad Content-Type
  if(req.headers['content-type'] !== 'application/json') {
    let error = 'Content-Type not JSON'
    console.error(error)
    res.status(400).send(error)
    return
  }

  // Bad filename
  if (!req.body.filename) {
    let error = 'Filename not found in body'
    console.error(error)
    res.status(400).send(error)
    return
  }
}

const postVideoInfo = (req, res) => {
  checkBodyForErrors(req, res)

  let videoItem = req.body
  let videoFile = videoItem.filename
  let videoPath = path.join(videoDir, videoFile)
  console.log('videoPath: ' + JSON.stringify(videoPath))

  if (fs.existsSync(videoPath)) {
    let process = ffmpeg(videoPath)
      .ffprobe(function(err, metadata) {
        console.dir(metadata)
        res.json(metadata)
      })
  } else {
    res.sendStatus(404)
  }
}

const putVideoToGIF = (req, res) => {
  checkBodyForErrors(req, res)

  let gifSettings = req.body
  console.log('gifSettings: ' + JSON.stringify(gifSettings))

  .seek('3:00')


  // auto-include boomerang version
  // provide multiple file sizes (and gifv)

  res.json(gifSettings)
}

const getGIFList = (req, res) => {
  res.json(gifDatabase);
}

const getGIFInfo = (req, res) => {
  let gifID = req.params.gifID

  console.log('gifID: ' + gifID)

  let gifItem = gifDatabase.findByKey('gifID', gifID)

  res.json(gifItem)
}

const deleteGIF = (req, res) => {
  let gifID = req.params.gifID

  console.log('gifID: ' + gifID)

  // delete gif

  res.json(404)
}

const deleteFrameCache = (req, res) => {
  let videoID = req.params.videoID

  console.log('videoID: ' + videoID)

  // delete frame cache

  res.json(404)
}

const postFrameCache = (req, res) => {
  checkBodyForErrors(req, res)

  let videoItem = req.body
  let videoFile = videoItem.filename
  let videoPath = path.join(videoDir, videoFile)
  console.log('videoPath: ' + JSON.stringify(videoPath))

  if (fs.existsSync(videoPath)) {
    let videoFrameCache = path.join(frameCacheDir, videoItem.videoID)
    // make storage dir
    database.makeStorageDirs(videoFrameCache)

    // let process = ffmpeg(videoPath)
    // .on('start', function(commandLine) {
    //   console.log('Spawned Ffmpeg with command: ' + commandLine)
    // })
    // .on('codecData', function(data) {
    //   console.log('Input is ' + data.audio + ' audio ' +
    //     'with ' + data.video + ' video')
    // })
    // .on('progress', function(progress) {
    //   console.log('Processing: ' + progress.percent + '% done');
    // })
    // .on('end', function(stdout, stderr) {
    //   console.log('Transcoding succeeded !')
    // })
    // .on('error', function(err, stdout, stderr) {
    //   console.log(err)
    //   res.status(500).send(err)
    //   return
    // })
    // .renice(5)
    // .save(path.join(videoFrameCache, 'frame_%03d.bmp'))


    let process = ffmpeg(videoPath)
      .on('filenames', function(filenames) {
        console.log('Will generate ' + filenames.join(', '))
      })
      .on('end', function() {
        console.log('Screenshots taken');
      })
      .screenshots({
        // Will take screens at 20%, 40%, 60% and 80% of the video
        count: 4,
        folder: videoFrameCache,
      })

    // let options = {
    //     timestamps: [30.5, '50%', '01:10.123'],
    //     filename: 'thumbnail-at-%s-seconds.png',
    //     size: '320x240'
    //   }

  }

  res.sendStatus(404)
}

// Reminder: Body only parses when header Content-Type: application/json

// analyze video info (length, fps, size)
router.post('/videoInfo', postVideoInfo)

// convert video to gif
router.put('/gif', putVideoToGIF)

// get all gifs
router.get('/gif', getGIFList)

// get gif info
router.get('/gif/:gifID', getGIFInfo)

// get all gifs from videoID
// (data sorting needs to be done on the frontend)

// delete gif
router.delete('/gif/:gifID', deleteGIF)

// provide frame cache on pull state (do not push state to other resources)
// detect state simply by looking at existing files (it is a cache, not a store)
// include low-q gif cache
// select video file / edit video again -> return frame cache
router.post('/framecache', postFrameCache)

// delete frame cache
router.delete('/framecache/:videoID', deleteFrameCache)
