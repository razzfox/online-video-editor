import React, { Component } from 'react';
import './App.css';
import Download from './video/Download';
import GIF from './gif/GIF';


// This project is build as JSON API first, then React and HTML. Backend content, then frontend navigation.
// Last gif app was front and backend simultanoeusly (in Bash CGI script), and that was bare-bones simple.

// TODO: Create a websocket that listens for server changes (new GIFs, new Videos, downloadQueue changes)


class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedVideoID: new URL(window.location.href).searchParams.get('videoID'),
      downloadURL: new URL(window.location.href).searchParams.get('download'),
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h1 className="App-logo">⭐</h1>
          <h2>Razz's GIF Generator ({process.env.NODE_ENV})</h2>
        </div>
        {/* TODO: React-Router */}
        <GIF selectedVideoID={this.state.selectedVideoID} />
        <Download />
      </div>
    );
  }
}

export default App;
