const fs = require('fs-extra')
const uuidgen = require('./uuidgen.js')

const versionID = '0.1'


// Database classes
class VideoItem {
  constructor(url, title, filename, thumbnailFilename) {
    this.id = uuidgen()
    this.url = url
    this.title = title
    this.filename = filename
    // TODO: make this an options object
    this.thumbnailFilename = thumbnailFilename
    // TODO: add more fields to reduce JS engine class mutations (speedup)
    // example: uploaded by, last used date, filesize
  }
}

class GIFItem {
  constructor(videoID, title, filename, gifSettings) {
    this.id = uuidgen()
    this.videoID = videoID
    this.title = title
    this.filename = `${filename}_${this.id}.gif`

    // TODO: make this an options object
    this.gifSettings = gifSettings

    // TODO: add fields to reduce JS engine class mutations (speedup)
    // example: created by, creation date, filesize


    // Possibly generate a long name when downloading
    // let gifFilename = `${path.parse(videoItem.filename)}_${gifRequest.start}_${gifRequest.length}_${gifRequest.options.width}_${gifRequest.options.loop}_${gifRequest.options.fps}_${gifRequest.options.bounce}.gif`
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
    this.versionID = versionID
    this.databaseFile = databaseFile
    // could name this: data, store, all, items, allItems, but we want to reduce name collisions, so be more specific
    this.databaseStore = {}

    // TODO: make this a manual action
    // restore database from disk
    this.restoreFromDisk()
  }

  restoreFromDisk() {
    // TODO: write and restore the entire database object, and check versionID against this file's versionID
    // possibly process this file, and create new objects from it, maybe when version changes
    if (fs.existsSync(this.databaseFile)) {
      this.databaseStore = JSON.parse(fs.readFileSync(this.databaseFile))

      console.log('Database ' + this.name + ' read from ' + this.databaseFile);
    } else {
      console.log('No Database File')
    }
  }

  saveToDisk() {
    fs.writeFile(this.databaseFile, JSON.stringify(this.databaseStore), error => {
      if (error) console.error(error)

      console.log('Database written to ' + this.databaseFile)
    })
  }

  findItemsByKey(keyName, value) {
    return Object.values(this.databaseStore).filter(item => item[keyName] === value)
  }

  // Note: this could be sorted in the future
  all() {
    return Object.values(this.databaseStore)
  }

  get(id) {
    return this.databaseStore[id]
  }

  add(addItem) {
    // this.databaseStore.unshift(addItem)
    this.databaseStore[addItem.id] = addItem

    // Save database to disk
    this.saveToDisk()
  }

  remove(removeItem) {
    // this.databaseStore = this.databaseStore.filter((item) => item !== removeItem)
    delete this.databaseStore[removeItem.id]

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

    fs.unlink(file, error => {
      if (error) console.error(error)
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
