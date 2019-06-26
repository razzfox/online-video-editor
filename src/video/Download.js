import React, { Component } from 'react';
import './Download.css';

// videoAPI for reference:
// app.get('/videos', sendVideoList)
// app.get('/videos/:videoID', sendVideoInfo)
// app.get('/videos/downloads/:videoID', sendVideoFile)
// app.get('/videos/downloads/progress', downloadProgress)
// app.post('/videos/downloads', bodyParser.json(), downloadFromURL)
// app.delete('/videos/:videoID', deleteVideoFile)


// Note about mobile apps:
// primarily select video file path (or remote video path)
// app download will not work


class Download extends Component {
  constructor(props) {
    super()

    // Note: do not mix setState() with this.state to access state values.
    // Since state changes are asynchronous, the values resolved by this.state
    // could easily be stale values when the given setState is applied.
    // Use callback setState( (state, props) => ({ propA: state.propB + 1 }) )
    // to ensure that the update is applied using the most recent state values.
    //
    // For example, a progress bar may try 'this.state.progress + 1', which will
    // resolve to a number (57, 58, 59, 60) before the setState message is sent.
    // As asynchronsous updates occur, the values will be applied to the state
    // out of order (57, 59, 58, 60), which causes a bouncy progress bar UI.
    //
    // Setting a value that is not from the state is fine, 'setState({ propA: 100 })'

    const backendLocation = 'http://localhost:3080'

    this.state = {
      downloadResponse: {},
      downloadProgressList: [],
      availableVideoList: [],
      videoURL: '',
      videoID: '',
      videoAPILocation: new URL('videos/', backendLocation),
      downloadsRoute: new URL('videos/downloads', backendLocation),
      progressRoute: new URL('videos/downloads/progress', backendLocation),
    }

    // React is opinionated about its one-way binding (omnidirectional data flow)
    // so the views ALWAYS reflect the state. View's input values can not change.
    // Only functions can update the state. So, views must trigger functions
    // to update the state (such as onChange, onClick).

    // binding here in the constructor means that there is one function created
    // whereas binding in the render function will create a new function object
    // each time it runs (on every render)
    this.inputURLChange = this.inputURLChange.bind(this)
    this.postVideoURL = this.postVideoURL.bind(this)
    this.getAvailableVideoList = this.getAvailableVideoList.bind(this)
    this.getDownloadProgress = this.getDownloadProgress.bind(this)
    this.videoIDChange = this.videoIDChange.bind(this)
    this.deleteVideoID = this.deleteVideoID.bind(this)
  }

  componentDidMount() {
    let event = new Event('componentDidMount', {bubbles: false, cancelable: true})
    this.getAvailableVideoList(event)
    this.getDownloadProgress(event)
  }

  getAvailableVideoList(event) {
    // prevent page navigation
    event.preventDefault()

    fetch(this.state.videoAPILocation).then(res => res.ok && res.json())
    .then(response => {
      console.log('AvailableVideoList Success:', response)
      this.setState({availableVideoList: response})
    })
    .catch(error => {
      console.error(error)
      this.setState({availableVideoList: JSON.stringify(error)})
    })
  }

  getVideoFile() {
    // Add video html element
  }

  getDownloadProgress(event) {
    // prevent page navigation
    event.preventDefault()

    fetch(this.state.progressRoute).then(res => res.ok && res.json())
    .then(response => {
      console.log('DownloadProgress Success:', response)
      this.setState({downloadProgressList: response})
    })
    .catch(error => {
      console.error(error)
      this.setState({downloadProgressList: JSON.stringify(error)})
    })
  }

  videoIDChange(event) {
    this.setState({videoID: event.target.value})
  }

  deleteVideoID(event) {
    // prevent page navigation
    event.preventDefault()

    fetch(new URL(this.state.videoID, this.state.videoAPILocation), {
        method: 'DELETE',
    }).then(res => res.ok && res.json())
    .then(response => {
      console.log('deleteVideoID Success:', response)
      this.setState({downloadResponse: response})
    })
    .catch(error => {
      console.error(error)
      this.setState({downloadResponse: JSON.stringify(error)})
    })
  }

  // file upload
  // postVideoFile() {
  //   var formData = new FormData();
  //   var fileField = document.querySelector('input[type='file']');
  //
  //   // var photos = document.querySelector('input[type='file'][multiple]');
  //   //
  //   // formData.append('title', 'My Vegas Vacation');
  //   // for (var i = 0; i < photos.files.length; i++) {
  //   //   formData.append('photos', photos.files[i]);
  //   // }
  //
  //   formData.append('username', 'abc123');
  //   formData.append('avatar', fileField.files[0]);
  //
  //   fetch('https://example.com/profile/avatar', {
  //     method: 'PUT',
  //     body: formData
  //   })
  //   .then(response => response.json())
  //   .catch(error => console.error(error))
  //   .then(response => console.log('VideoFileSuccess:', JSON.stringify(response)));
  // }

  inputURLChange(event) {
    this.setState({videoURL: event.target.value})
  }

  postVideoURL(event) {
    // prevent page navigation
    event.preventDefault()

    console.log('Sending videoURL: ' + this.state.videoURL)

    let data = { url: this.state.videoURL }

    // Note: the 'no-cors' option *silently* disables sending the body
    fetch(this.state.downloadsRoute, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data), // body data type must match 'Content-Type' header
    }).then(res => res.ok && res.json())
    .then(response => {
      console.log('VideoURL Success:', response)
      this.setState({downloadResponse: response})
    })
    .catch(error => {
      console.error(error)
      this.setState({downloadResponse: JSON.stringify(error)})
    })
  }

  render() {
    return (
      <div className='Download'>
        <h1 className='intro'>
          Download Videos from YouTube or other sites!
        </h1>
        <form id='downloadURLForm'
          onSubmit={this.postVideoURL}>
          <label id='downloadURLLabel'>
            Video URL:
            <textarea id='downloadURL' type='text'
              value={this.state.videoURL}
              onChange={this.inputURLChange} />
          </label>
          <br/>
          <button id='downloadURLButton' type='submit'>Submit URL</button>
        </form>

        {/* <a>Download Response</a>
        <pre id='downloadResponse'>{JSON.stringify(this.state.downloadResponse)}</pre> */}

        {/* <form id='deleteVideoIDForm'
          onSubmit={this.deleteVideoID}>
          <label id='deleteVideoIDLabel'>
            Delete Video ID:
            <textarea id='deleteVideoID' type='text'
              value={this.state.videoID}
              onChange={this.videoIDChange} />
          </label>
          <br/>
          <button id='deleteVideoIDButton' type='submit'>Submit Video ID</button>
        </form> */}

        {/* <form>
          <a>Download Progress</a>
          <button id='downloadProgressButton'
            onClick={this.getDownloadProgress}>Get Download Progress</button>
          <pre id='downloadProgressList'>{JSON.stringify(this.state.downloadProgressList)}</pre>
        </form> */}

        {/* <form>
          <a>Available Videos</a>
          <button id='availableVideoButton'
            onClick={this.getAvailableVideoList}>Get Available Videos</button>
          <pre id='availableVideoList'>{JSON.stringify(this.state.availableVideoList)}</pre>
        </form> */}

      </div>
    );
  }
}

export default Download;
