const fs = require('fs')
const path = require('path')

const database = require('./database.js')

// const ffmpeg = require('ffmpeg')

const express = require('express')
const cors = require('cors')
// const app = express()
const app = module.exports = express()
const port = 3080
const bodyParser = require('body-parser')


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


// get video info (length, fps, size)

// get gif info

// get all gifs
// get all gifs from videoID

// convert video timestamp to gif
// auto-include boomerang version

// delete gif

// select video file / edit video again



// ???
// get frame cache state?
// start/stop frame cache?
// is frame cache followed by low-q gif cache?
