import React, { Component } from 'react';
import './Download.css';


class Download extends Component {
  constructor(props) {
    super(props)

    this.state = {
      infoBox: {},
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

  static getDerivedStateFromProps(nextProps, prevState){
    if(nextProps.selectedVideoID && nextProps.availableVideoList) {
      let videoItem = nextProps.availableVideoList.find(video => video.id === nextProps.selectedVideoID)
      return { infoBox: videoItem }
    }

    // required to return something
    return null
  }

  postDownloadURL() {
    // Using HTML forms has the unnecessary side effect of reloading the page with the response,
    // so if this is an onSubmit event, we have to prevent page navigation
    // event.preventDefault()

    // Warning: the 'no-cors' option *silently* disables sending the body
    fetch(this.state.downloadsRoute, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: this.state.downloadURL }), // body data type must match 'Content-Type' header
    }).then(res => res.ok && res.json())
    .then(response => {
      console.log('downloadURL', response)
      this.setState({infoBox: response})
      // start monitoring download progress (only if list is empty, to prevent double requests)
      this.state.downloadProgressList.length === 0 && this.fetchStateUpdate(this.state.progressRoute, 'downloadProgressList', this.continueDownloadProgressList)
    })
    .catch(error => {
      console.error('downloadURL Error', error)
      this.setState({infoBox: JSON.stringify(error)})
    })
  }

  continueDownloadProgressList() {
    // if downloads are in progress, update list and call this function again
    if(this.state.downloadProgressList.length > 0) {
      this.fetchStateUpdate(this.state.progressRoute, 'downloadProgressList', this.continueDownloadProgressList)
    } else {
      // after all downloads finish, do not call this function again
      // update parent's videoList and selectedVideoID
      this.props.updateAvailableVideoList(this.state.infoBox && this.state.infoBox.id)
      // reset download state
      this.setState({
        infoBox: {},
      })
    }
  }

  deleteVideoID() {
    fetch(new URL(this.props.selectedVideoID, this.props.videoAPILocation), {
        method: 'DELETE',
    }).then(response => {
      console.log('deleteVideoID', response)
      const deletedItem = this.props.availableVideoList.find(video => video.id === this.props.selectedVideoID)
      deletedItem && this.setState({infoBox: `Deleted ${deletedItem.title}`})
      this.props.updateAvailableVideoList()
    })
    .catch(error => {
      console.error('deleteVideoID Error', error)
      this.setState({infoBox: JSON.stringify(error)})
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

      <h3>Info</h3>
      <pre id='infoBox'>{JSON.stringify(this.state.infoBox)}</pre>
      <pre id='downloadProgressList'>{JSON.stringify(this.state.downloadProgressList)}</pre>
    
      <button id='deleteVideoIDButton'
        onClick={this.deleteVideoID}>
        Delete Selected Video
      </button>
    </div>
  }
}

export default Download;
