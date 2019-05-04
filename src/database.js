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

class GIFItem {
  constructor(videoID, name, filename, settings) {
    this.gifID = uuidgen()
    this.videoID = videoID
    this.name = name
    this.filename = `${filename}_${this.gifID}.gif`
    this.settings = settings
  }
}

class GIFSettings {
  constructor(start, length, options) {
    // seek: number or string format [[hh:]mm:]ss[.xxx]
    this.start = start
    // duration: same formats as above
    this.length = length
    // may be #x# or #x?
    this.width = options.width
    this.loop = options.loop
    this.fps = options.fps
    this.bounce = options.bounce
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
    })
  }

  findItemsByKey(keyName, value) {
    return this.databaseStore.filter(item => item[keyName] === value)
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
  for(let dir of arguments) {
    if (!fs.existsSync(dir)){
      console.log('Creating dir ' + dir);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}


// Delete files
const deleteFiles = (...arguments) => {
  for(let file of arguments) {
    console.log('deleting ' + file)

    fs.unlink(file, (err) => {
      // if (err) throw err;
      if (err) console.error(err)
    })
  }
}


////
// Export module
////

module.exports = {
  VideoItem: VideoItem,
  GIFItem: GIFItem,
  GIFSettings: GIFSettings,
  Database: Database,
  makeStorageDirs: makeStorageDirs,
  deleteFiles: deleteFiles,
}
