import React, { Component } from 'react';
import './App.css';
import Download from './video/Download';
import Clip from './video/Clip';


// This project is build as JSON API first, then React and HTML.
// Redux is not used here because top component state management is sufficient for small apps.

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

    // bind functions that will be called from the render context (and need this context)
    this.inputStateUpdate = this.inputStateUpdate.bind(this)

    // bind functions that will be called from child components to be run in this context
    this.updateAvailableVideoList = this.updateAvailableVideoList.bind(this)
  }

  componentDidMount() {
    // first time selectedVideoID
    if(this.state.selectedVideoID)
      this.updateSelectedVideoInfo()

    this.updateAvailableVideoList()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // react to change to selectedVideoID
    if(prevState.selectedVideoID !== this.state.selectedVideoID)
      this.updateSelectedVideoInfo()
  }

  // TODO: Use memoization (aka caching/collection)
  updateSelectedVideoInfo() {
    this.fetchStateUpdate(new URL(`${this.state.selectedVideoID}/info/`, this.state.videoAPILocation), 'selectedVideoInfo')
  }

  // to be passed to child to update parent state
  updateAvailableVideoList = nextSelectedVideoID => this.fetchStateUpdate(this.state.videoAPILocation, 'availableVideoList', () =>
    this.setState((state, props) => {
      if(state.availableVideoList.length === 0)
        return { selectedVideoID: '' }

      // choose nextSelectedVideoID
      if(nextSelectedVideoID && state.availableVideoList.some(video => video.id === nextSelectedVideoID))
        return { selectedVideoID: nextSelectedVideoID }

      // choose first item from availableVideoList
      if(! state.selectedVideoID || ! state.availableVideoList.some(video => video.id === state.selectedVideoID) )
        return { selectedVideoID: state.availableVideoList[0].id }
    })
  )

  // this helper function makes an api call and updates state in a standardized way (based on var name)
  fetchStateUpdate(apiLocation, stateVariable, callback) {
    fetch(apiLocation).then(res => res.json())
    .then(res => {
      console.log(`Fetched ${stateVariable}`, res)
      this.setState({[stateVariable]: res}, callback)
    })
    .catch(error => console.error(`Fetch error ${apiLocation} ${stateVariable}`, error) )
  }

  // this helper function updates state in a standardized way based on event target name
  inputStateUpdate(event, stateVariable, callback) {
    this.setState({[stateVariable || event.target.name || event.target.id]: event.target.value}, callback)
  }

  SelectVideo = () => <section>
    <h3>Select Video</h3>
    <this.DropdownList
      id='selectedVideoID'
      data={this.state.availableVideoList}
      value={this.state.selectedVideoID}
      onChange={this.inputStateUpdate}
    />
  </section>

  // takes an array of {id, title} objects
  DropdownList = props => <select {...props}>{props.data.map((item, index) => <option key={index} value={item.id}>{item.title}</option>)}</select>

  render() {
    return (
      <div className='App'>
        <header>
          <h1 className='App-logo'><span role='img' aria-label='logo'>⭐</span></h1>
          <h1>Online Video Editor <sub>Concept</sub></h1>
        </header>
        <this.SelectVideo />
        <Clip {...this.state} />
        <Download {...this.state}
          updateAvailableVideoList={this.updateAvailableVideoList}
        />
      </div>
    );
  }
}

export default App;
