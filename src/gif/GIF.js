import React, { Component } from 'react';
import './GIF.css';

// gifAPI for reference:
// router.post('/videoInfo', postVideoInfo)
// router.put('/gif', putVideoToGIF)
// router.get('/gif', getGIFList)
// router.get('/gif/:gifID', getGIFInfo)
// router.delete('/gif/:gifID', deleteGIF)
// router.post('/framecache', postFrameCache)
// router.delete('/framecache/:videoID', deleteFrameCache)
// router.post('/gifcache', postGIFCache)
// router.delete('/gifcache/:videoID', deleteGIFCache)


// Note about mobile apps:
// ffmpeg may not be available
// implement a remote ffmpeg server


class GIF extends Component {
  constructor(props) {
    super()

    let backendLocation = 'http://localhost:3080'
    this.state = {
      videoAPILocation: new URL('video', backendLocation),
      gifAPILocation: new URL('gif', backendLocation),

      gifFileLocation: '/gifs/',
      
      availableVideoList: [],
      availableGIFList: [],

      // TODO: get selectedVideoID from URL query (?selectedVideoID=)
      // selectedVideoID: props.selectedVideoID,
      selectedVideoID: '',
    }

    this.getStateUpdate = this.getStateUpdate.bind(this)

    this.inputStateUpdate = this.inputStateUpdate.bind(this)
  }

  componentDidMount() {
    this.getStateUpdate(this.state.videoAPILocation, 'availableVideoList', () => {
      if(this.state.availableVideoList.length > 0) return {selectedVideoID: this.state.availableVideoList[0]}
    })
    this.getStateUpdate(this.state.gifAPILocation, 'availableGIFList')
  }

  getStateUpdate(apiLocation, stateVariable, callback) {
    // console.log(`Fetch ${apiLocation}, ${stateVariable}`)
    // console.log(`Fetch response ${res.url} ${res.status} ${stateVariable}`)

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

  inputStateUpdate(event, stateVariable) {
    console.log(`Changed input ${stateVariable} to ${event.target.value}`)

    this.setState({[stateVariable]: event.target.value})
  }

  render() {
    // takes an array of items, with {id, name} properties
    const DropDownList = props => <select value={props.value} onChange={props.onChange}>{props.data.map((item, index) => <option key={index} value={item.id}>{item.name}</option>)}</select>
    
    const availableVideoMapping = this.state.availableVideoList.map(videoItem => ({id: videoItem.videoID, name: videoItem.title}))

    // start list on blank item
    availableVideoMapping.unshift([null,null])

    const ImageGrid = props => <div>{props.data.map((item, index) => <img key={index} alt={item.gifID} src={this.state.gifFileLocation + item.filename} />)}</div>
    
    return (
      <div className="section">
        <h1 className="intro">
          Convert a video
        </h1>

        <DropDownList
          data={availableVideoMapping}
          value={this.state.selectedVideoID}
          onChange={(ev) => this.inputStateUpdate(ev, 'selectedVideoID')}
        />

        <form>
          <a>Available GIFs</a>
          <button id="availableVideoButton"
            onClick={(ev) => {
              this.getStateUpdate(this.state.gifAPILocation, 'availableGIFList')
              ev.preventDefault()
            }}>Get Available GIFs</button>
          <ImageGrid id="availableGIFList"
            data={this.state.availableGIFList}
          />
        </form>

      </div>
    )
  }
}

export default GIF;
