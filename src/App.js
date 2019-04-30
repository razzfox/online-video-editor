import React, { Component } from 'react';
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
// app.get('/video/download/:videoID', sendVideoFile)


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
          <h1 className="App-logo">⭐</h1>
          <h2>Razz's GIF Generator</h2>
        </div>
        <GIFGenerator />
        // <Download />
      </div>
    );
  }
}

export default App;
