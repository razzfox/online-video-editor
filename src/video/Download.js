import React, { Component } from 'react';
import './Download.css';


class Download extends Component {
  constructor(props) {
    super(props)
    this.state = {
      downloadResponse: {},
      downloadProgressList: [],
      downloadURL: '',
      nextSelectedVideoItem: {},

      downloadsRoute: new URL('videos/downloads', props.backendLocation),
      progressRoute: new URL('videos/downloads/progress', props.backendLocation),
    }

    this.inputStateUpdate = this.props.inputStateUpdate.bind(this)
    this.postDownloadURL = this.postDownloadURL.bind(this)
    this.deleteVideoID = this.deleteVideoID.bind(this)
  }

  getVideoFile() {
    // Add video html element
  }

  getDownloadProgressList() {
    fetch(this.state.progressRoute).then(res => res.ok && res.json())
    .then(response => {
      console.log('downloadProgressList Success:', response)
      // update continuously until download is finished
      this.setState({downloadProgressList: response}, () => {
        // TODO: move this logic to componentDidUpdate(prevProps, prevState, snapshot)
        if(this.state.downloadProgressList.length > 0) this.getDownloadProgressList()
        else {
          // update selected video on finished download
          this.props.updateAvailableVideoList(this.state.nextSelectedVideoItem && this.state.nextSelectedVideoItem.id)
          this.setState({
            downloadResponse: {},
            nextSelectedVideoItem: {},
          })

        }
      })
    })
    .catch(error => {
      console.error('downloadProgressList Error:', error)
      this.setState({downloadProgressList: JSON.stringify(error)})
    })
  }

  deleteVideoID() {
    fetch(new URL(this.props.selectedVideoID, this.props.videoAPILocation), {
        method: 'DELETE',
    }).then(res => res.ok)
    .then(response => {
      console.log('deleteVideoID Success:', response)
      const deletedItem = this.props.availableVideoList.find(video => video.id === this.props.selectedVideoID)
      this.setState({downloadResponse: `Deleted ${deletedItem.title}`})
      this.props.updateAvailableVideoList()
    })
    .catch(error => {
      console.error('deleteVideoID Error:', error)
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

    console.log('Sending downloadURL: ' + this.state.downloadURL)

    let body = { url: this.state.downloadURL }

    // Note: the 'no-cors' option *silently* disables sending the body
    fetch(this.state.downloadsRoute, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body), // body data type must match 'Content-Type' header
    }).then(res => res.ok && res.json())
    .then(response => {
      console.log('downloadURL Success:', response)
      this.setState({downloadResponse: response})
      this.setState({nextSelectedVideoItem: response})
      // start monitoring download progress
      this.getDownloadProgressList()
    })
    .catch(error => {
      console.error('downloadURL Error:', error)
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

      <a>Active Downloads</a>
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
