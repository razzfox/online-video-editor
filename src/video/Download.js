import React, { Component } from 'react';
import './Download.css';

// videoAPI for reference  :
// app.get('/video/download', sendVideoList)
// app.get('/video/download/progress', downloadProgress)
// app.get('/video/download/:videoID', sendVideoFile)
// app.get('/video/:videoID', sendVideoInfo)
//
// app.post('/video/download', bodyParser.json(), downloadFromURL)
//
// app.delete('/video/:videoID', deleteVideoFile)


class Download extends Component {
  constructor(props) {
    super()
    this.state = {
      downloadProgress: [],
      availableVideos: [],
      videoURL: '',
      videoAPILocation: 'http://localhost:3080/video/download'
    }

    this.inputURLChange = this.inputURLChange.bind(this)
    this.postVideoURL = this.postVideoURL.bind(this)
  }

  getVideoList() {


  }
  getVideoFile() {

  }
  deleteVideoFile() {

  }
  getDownloadProgress() {

  }

  // file upload
  // postVideoFile() {
  //   var formData = new FormData();
  //   var fileField = document.querySelector("input[type='file']");
  //
  //   // var photos = document.querySelector("input[type='file'][multiple]");
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
  //   .catch(error => console.error('Error:', error))
  //   .then(response => console.log('Success:', JSON.stringify(response)));
  // }

  inputURLChange(event) {
    this.setState({videoURL: event.target.value});
  }

  postVideoURL(event) {
    console.log(this.state.videoURL);

    let data = { url: this.state.videoURL }

    // Note: the mode: "no-cors" option *silently* disables sending the body
    fetch(this.state.videoAPILocation, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    }).then(res => res.ok && res.json())
    .then(response => console.log('Success:', JSON.stringify(response)))
    .catch(error => console.error('Error:', error))

    event.preventDefault();
  }

  render() {
    return (
      <div className="Download">
        <h1 className="intro">
          Download Videos from YouTube or other sites!
        </h1>
        <form id="downloadURLForm" onSubmit={this.postVideoURL}>
          <label id="downloadURLLabel">
            Video URL:
            <textarea id="downloadURL" type="text"
              value={this.state.videoURL}
              onChange={this.inputURLChange} />
          </label>
          <br/>
          <input  id="submitButton" type="submit" value="Submit" />
        </form>
        <pre id="downloadResponse"></pre>
      </div>
    );
  }
}

export default Download;
