const fs = require('fs')
const path = require('path')

const database = require('./database.js')

// const ffmpeg = require('ffmpeg')

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

const gifDir = path.join(__dirname, '..', '/public/gifs/')
const frameCacheDir = path.join(__dirname, '..', '/public/frameCache/')
const gifDatabaseFile = path.join(__dirname, '..', '/gifDatabase.json')

// initialize storage
database.makeStorageDirs(gifDir, frameCacheDir)
const gifDatabase = new database.Database('GIFs', gifDatabaseFile)


const postVideoInfo = (req, res) => {
  let videoItem = req.body
  console.log('videoItem: ' + JSON.stringify(videoItem))

  res.json(videoItem);
}

const putVideoToGIF = (req, res) => {
  let gifSettings = req.body
  console.log('gifSettings: ' + JSON.stringify(gifSettings))


  // auto-include boomerang version
  // provide multiple file sizes (and gifv)

  res.json(gifSettings);
}

const getGIFList = (req, res) => {
  res.json(gifDatabase);
}

const getGIFInfo = (req, res) => {
  let gifID = req.params.gifID

  console.log('gifID: ' + gifID)

  let gifItem = gifDatabase.findByKey('gifID', gifID)

  res.json(gifItem);
}

const deleteGIF = (req, res) => {
  let gifID = req.params.gifID

  console.log('gifID: ' + gifID)

  res.json(404);
}

const postFrameCache = (req, res) => {
  let videoItem = req.body
  console.log('videoItem: ' + JSON.stringify(videoItem))

  res.json(videoItem);
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
