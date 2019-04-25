import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// Don't build a web component alongside the data. Build ONLY the data.
// Think of it as JSON first, then HTML. Backend content, then frontend.
// So, you'll worry about frontend navigation later.
//
// ----
// Last time, gif app was front and backend simultanoeusly.
// This time, I need to do API development first (script all actions),
// Second, do frontend development (call API actions and show results).

class App extends Component {
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
  postVideoFile() {
    var formData = new FormData();
    var fileField = document.querySelector("input[type='file']");

    // var photos = document.querySelector("input[type='file'][multiple]");
    //
    // formData.append('title', 'My Vegas Vacation');
    // for (var i = 0; i < photos.files.length; i++) {
    //   formData.append('photos', photos.files[i]);
    // }

    formData.append('username', 'abc123');
    formData.append('avatar', fileField.files[0]);

    fetch('https://example.com/profile/avatar', {
      method: 'PUT',
      body: formData
    })
    .then(response => response.json())
    .catch(error => console.error('Error:', error))
    .then(response => console.log('Success:', JSON.stringify(response)));
  }

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
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React/Electron</h2>
        </div>
        <form onSubmit={this.postVideoURL}>
          <label>
            URL of video:
            <input id="downloadURL" type="text"
              value={this.state.videoURL}
              onChange={this.inputURLChange} />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <pre id="downloadResponse"></pre>
        <pre className="App-intro">
          Download Videos!
        </pre>
      </div>
    );
  }
}

export default App;
