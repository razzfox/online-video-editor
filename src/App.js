import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Download from './video/Download';


// Don't build a web component alongside the data. Build ONLY the data.
// Think of it as JSON first, then HTML. Backend content, then frontend.
// So, you'll worry about frontend navigation later.
//
// ----
// Last time, gif app was front and backend simultanoeusly.
// This time, I need to do API development first (script all actions),
// Second, do frontend development (call API actions and show results).


// videoAPI for reference  :
// app.get('/video/download', sendVideoList)
// app.get('/video/download/progress', downloadProgress)
// app.get('/video/download/:videoID', sendVideoFile)
// app.get('/video/:videoID', sendVideoInfo)
//
// app.post('/video/download', bodyParser.json(), downloadFromURL)
//
// app.delete('/video/:videoID', deleteVideoFile)


class App extends Component {
  constructor(props) {
    super()
    this.state = {
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>GIF Generator</h2>
        </div>
        <Download />
      </div>
    );
  }
}

export default App;
