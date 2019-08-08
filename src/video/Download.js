import React, { Component } from 'react';
import './Download.css';


class Download extends Component {
  constructor(props) {
    super(props)
    this.state = {
      downloadResponse: {},
      downloadProgressList: [],
      downloadURL: '',

      downloadsRoute: new URL('videos/downloads', props.backendLocation),
      progressRoute: new URL('videos/downloads/progress', props.backendLocation),
    }

    // bind functions that will be called inside the render context
    this.postDownloadURL = this.postDownloadURL.bind(this)
    this.deleteVideoID = this.deleteVideoID.bind(this)
    this.continueDownloadProgressList = this.continueDownloadProgressList.bind(this)
    // reassign context for borrowed functions
    this.fetchStateUpdate = props.fetchStateUpdate.bind(this)
    this.inputStateUpdate = props.inputStateUpdate.bind(this)
  }

  getVideoFile() {
    // Add video html element
  }

  continueDownloadProgressList() {
    // if downloads are in progress, update list and call this function again
    if(this.state.downloadProgressList.length > 0) this.fetchStateUpdate(this.state.progressRoute, 'downloadProgressList', this.continueDownloadProgressList)
    else {
      // after all downloads finish, do not call this function again
      // update parent's videoList and selectedVideoID
      this.props.updateAvailableVideoList(this.state.downloadResponse && this.state.downloadResponse.id)
      // reset download state
      this.setState({
        downloadResponse: {},
      })
    }
  }

  deleteVideoID() {
    fetch(new URL(this.props.selectedVideoID, this.props.videoAPILocation), {
        method: 'DELETE',
    }).then(response => {
      console.log('deleteVideoID', response)
      const deletedItem = this.props.availableVideoList.find(video => video.id === this.props.selectedVideoID)
      deletedItem && this.setState({downloadResponse: `Deleted ${deletedItem.title}`})
      this.props.updateAvailableVideoList()
    })
    .catch(error => {
      console.error('deleteVideoID Error', error)
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

  postDownloadURL() {
    // Using HTML forms has the unnecessary side effect of reloading the page with the response,
    // so if this is an onSubmit event, we have to prevent page navigation
    // event.preventDefault()
    console.log('POST downloadURL', this.state.downloadURL)

    const url = this.state.downloadURL

    // Note: the 'no-cors' option *silently* disables sending the body
    fetch(this.state.downloadsRoute, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({url}), // body data type must match 'Content-Type' header
    }).then(res => res.ok && res.json())
    .then(response => {
      console.log('downloadURL', response)
      this.setState({downloadResponse: response})
      // start monitoring download progress
      this.fetchStateUpdate(this.state.progressRoute, 'downloadProgressList', this.continueDownloadProgressList)
    })
    .catch(error => {
      console.error('downloadURL Error', error)
      this.setState({downloadResponse: JSON.stringify(error)})
    })
  }

  render() {
    return <div className='Download'>
      <h1 className='intro'>
        Enter link to YouTube or other video
      </h1>

      <label id='downloadURLLabel'>
        Video URL:
        <textarea id='downloadURL'
          type='text'
          value={this.state.downloadURL}
          onChange={this.inputStateUpdate} />
      </label>
      <button id='downloadURLButton'
        onClick={this.postDownloadURL}>
        Download Video URL
      </button>

      <h3>Active Downloads</h3>
      <pre id='downloadResponse'>{JSON.stringify(this.state.downloadResponse)}</pre>
      <pre id='downloadProgressList'>{JSON.stringify(this.state.downloadProgressList)}</pre>
    
      <button id='deleteVideoIDButton'
        onClick={this.deleteVideoID}>
        Delete Selected Video
      </button>
    </div>
  }
}

export default Download;
