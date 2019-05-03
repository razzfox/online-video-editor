const assert = require('assert')

// this object is easy to copy over from react components
const this.state = {
  downloadResponse: {},
  downloadProgressList: [],
  availableVideoList: [],
  videoURL: '',
  videoID: '',
  videoAPILocation: 'http://localhost:3080/video/',
  downloadRoute: 'download/',
  progressRoute: 'download/progress',
  gifAPILocation: 'http://localhost:3080/gif/',
  cacheRoute: 'cache'
}

function emptyVideoList(){
  const empty = fetch(){}

  assert.deepEqual(empty, [])
}()
