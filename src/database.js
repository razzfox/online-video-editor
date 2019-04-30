const fs = require('fs')
const path = require('path')

const uuidgen = require('./uuidgen.js')


// Database classes
class VideoItem {
  constructor(url, title, filename) {
    this.videoID = uuidgen()
    this.url = url
    this.title = title
    this.filename = filename
  }
}

class GifItem {
  constructor(videoID, name, filename, settings) {
    this.gifID = uuidgen()
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

  add(addItem) {
    this.databaseStore.unshift(addItem)

    // Save database to disk
    this.saveToDisk()
  }

  remove(removeItem) {
    this.databaseStore = this.databaseStore.filter((item) => item !== removeItem)

    // Save database to disk
    this.saveToDisk()
  }
}


// File storage
const makeStorageDirs = (...arguments) => {
  console.log('Initializing storage dirs...');

  for(let dir of arguments) {
    if (!fs.existsSync(dir)){
      console.log('Creating dir ' + dir);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}


////
// Export module
////

module.exports = {
  VideoItem: VideoItem,
  GifItem: GifItem,
  GifSettings: GifSettings,
  Database: Database,
  makeStorageDirs: makeStorageDirs,
}
