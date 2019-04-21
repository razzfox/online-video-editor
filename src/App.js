import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React/Electron</h2>
        </div>
        <p className="App-intro">
          // Don't build a web component alongside the data. Build ONLY the data.
          // Think of it as JSON first, then HTML. Backend content, then frontend.
          // So, you'll worry about frontend navigation later.
          //
          // ----
          // Last time, gif app was front and backend simultanoeusly.
          // This time, I need to do API development first (script all actions),
          // Second, do frontend development (call API actions and show results).
        </p>
      </div>
    );
  }
}

export default App;
