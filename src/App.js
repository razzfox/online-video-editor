import React, { Component } from 'react';
import './App.css';
import Download from './video/Download';
import GIF from './gif/GIF';


// This project is build as JSON API first, then React and HTML. Backend content, then frontend navigation.
// Last gif app was front and back ends simultaneously (using Bash CGI scripts), and that was bare-bones simple.

// TODO: Create a websocket that listens for server changes (new GIFs, new Videos, downloadQueue changes)

// Note: Redux is not used here because top component state management is sufficient for small apps

class App extends Component {
  constructor(props) {
    super(props)

    const backendLocation = `${window.location.protocol}//${window.location.hostname}:3080`

    this.state = {
      backendLocation,

      videoAPILocation: new URL('videos/', backendLocation),

      selectedVideoID: new URL(window.location.href).searchParams.get('videoID') || '',
      selectedVideoInfo: {format: {duration: 0}},

      availableVideoList: [],
      downloadURL: new URL(window.location.href).searchParams.get('download'),

      fetchStateUpdate: this.fetchStateUpdate,
      inputStateUpdate: this.inputStateUpdate,
    }
  }

  componentDidMount() {
    this.fetchStateUpdate(this.state.videoAPILocation, 'availableVideoList', () => {
      if(this.state.availableVideoList.length > 0) this.updateSelectedVideoID(this.state.availableVideoList[0].id)
    })
  }

  updateSelectedVideoID(id) {
    this.setState({selectedVideoID: id}, this.updateSelectedVideoInfo)
  }

  updateSelectedVideoInfo() {
    this.fetchStateUpdate(new URL(`${this.state.selectedVideoID}/info/`, this.state.videoAPILocation), 'selectedVideoInfo')
  }

  fetchStateUpdate(apiLocation, stateVariable, callback) {
    fetch(apiLocation).then(res => res.json())
    .then(res => {
      console.log(`Response ${stateVariable}: `, res)
      this.setState({[stateVariable]: res}, callback)
    })
    .catch(error => {
      console.error(`Fetch error ${apiLocation} ${stateVariable}: `, error)
      this.setState({[stateVariable]: []})
    })
  }

  inputStateUpdate(event, stateVariable, callback) {
    this.setState({[stateVariable || event.target.name || event.target.id]: event.target.value}, callback)
  }

  SelectVideo = () => <div className='section'>
    <h1 className='intro'>Select clip</h1>
    <this.DropdownList
      id='selectedVideoID'
      data={this.state.availableVideoList}
      value={this.state.selectedVideoID}
      onChange={event => this.updateSelectedVideoID(event.target.value)}
    />
  </div>

  // takes an array of {id, title} objects
  DropdownList = props => <select {...props}>{props.data.map((item, index) => <option key={index} value={item.id}>{item.title}</option>)}</select>

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h1 className="App-logo">⭐</h1>
          <h2>Razz's GIF Generator ({process.env.NODE_ENV})</h2>
        </div>
        {/* TODO: React-Router */}
        <this.SelectVideo />
        <GIF {...this.state} />
        <Download {...this.state} />
      </div>
    );
  }
}

export default App;
