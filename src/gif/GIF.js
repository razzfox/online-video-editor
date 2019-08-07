import React, { Component } from 'react'
import './GIF.css'


class GIF extends Component {
  constructor(props) {
    super(props)
    this.state = {
      gifAPILocation: new URL('gifs/', props.backendLocation),
      // TODO: gifFileLocation is different for web and electron clients
      gifFileLocation: new URL('gifs/', props.backendLocation),
      frameCacheAPILocation: new URL('frames/', props.backendLocation),

      availableGIFList: [],
      displayedGIFList: [],

      // Note: React does not support nested state objects.
      // react will not update views because it uses shallow comparison.

      bounce: false,
      fps: 30,
      // time format: number or string format [[hh:]mm:]ss[.xxx]
      length: 1,      
      loop: true,
      start: 0,
      // may be #x# or #x?
      width: '200',
    }

    // bind functions that will be called inside the render context
    this.putGIF = this.putGIF.bind(this)
    this.deleteGIF = this.deleteGIF.bind(this)
    this.replaceGIFSettings = this.replaceGIFSettings.bind(this)
    // reassign context for borrowed functions
    this.fetchStateUpdate = props.fetchStateUpdate.bind(this)
    this.inputStateUpdate = props.inputStateUpdate.bind(this)
  }

  componentDidMount() {
    // first time selectedVideoID
    if(this.props.selectedVideoID) this.updateAvailableGIFList()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // react to change to selectedVideoID
    // these are independent because a new video could have new gifs
    if(prevProps.selectedVideoID !== this.props.selectedVideoID) this.updateAvailableGIFList()
    if(prevState.availableGIFList !== this.state.availableGIFList) this.updateDisplayedGIFList()
  }

  // Note: deriving one state value from another requires using a (state, props) => function
  updateDisplayedGIFList = () => this.setState((state, props) => ({ displayedGIFList: state.availableGIFList.filter(item => item.videoID === props.selectedVideoID) }) )

  updateAvailableGIFList = () => this.fetchStateUpdate(this.state.gifAPILocation, 'availableGIFList')

  putGIF() {
    const {bounce, fps, length, loop, start} = this.state
    // add properties to body object
    const body = {
      id: this.props.selectedVideoID,
      start,
      length,
      options: {
        bounce,
        fps,
        loop,        // may be '#x#' or '#x?'
        width: `${this.state.width}x?`,
      },
    }

    fetch(this.state.gifAPILocation, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(body), // body data type must match 'Content-Type' header
    }).then(res => {
      if(res.redirected) {
        let msg = 'GIF already exists:'
        throw new Error(msg)
      } else {
        return res.json()
      }
    })
    .then(response => {
      // Redirect because resource already exists
        console.log('Created GIF', response)
        // Since state changes are asynchronous, the values resolved by this.state
        // when this function is called could already be stale values.
        // Use callback setState( (state, props) => ({ propA: state.propB + 1 }) )    
        this.setState((state, props) => ({availableGIFList: [...state.availableGIFList, response]}) )
    })
    .catch(error => {
      console.error(error)
      // TODO: show an error
    })
  }

  deleteGIF(event) {
    const gifID = event.target.getAttribute('value')
    fetch(new URL(gifID, this.state.gifAPILocation), {
      method: 'DELETE',
    }).then(res => res.ok && res)
    .then(response => {
      console.log('Deleted GIF', response)
      this.setState((state, props) => ({availableGIFList: state.availableGIFList.filter(item => item.id !== gifID)}) )
    })
    .catch(error => {
      console.error(error)
      // TODO: show an error
    })
  }

  replaceGIFSettings(event) {
    const gifID = event.target.getAttribute('data-gif-id')
    const gifItem = this.state.displayedGIFList.find(item => item.id === gifID)
    const width = gifItem.gifSettings.width.split('x')[0]
    this.setState({ ...gifItem.gifSettings, width })
  }

  videoPreviewFrameTimestamps() {
    if(!this.props.selectedVideoID) return []

    // let start = Number.parseFloat(this.state.start, 10)
    // use integers to keep preview frames at regular intervals
    let start = Number.parseInt(this.state.start, 10)

    // length is not longer than the duration minus the start time
    // add 1 to include the final frame?
    let length = this.props.selectedVideoInfo.format.duration - start + 1
    
    // max length on screen
    if(length > 8) length = 8

    // if(start + length > length) length = length - start

    // creates an array of {id, filename} objects
    let previewDegree = 'seconds'
    switch(previewDegree) {
      case 'seconds':
        // shift by 1 to allow start frame in another component
        return Array.from({length}, (value, id) => ({id, filename: id + start}) ).slice(1)
        // break;
      case 'frames':
        return Array.from({length}, (value, id) => ({id, filename: `:${id + start}`}) ).slice(1)
        // break;
      case 'deciseconds':
        return Array.from({length}, (value, id) => ({id, filename: (id/10) + start}) ).slice(1)
        // break;
      default:
        return []
    }
  }

  videoPreviewFrameSteps() {
    if(!this.props.selectedVideoID) return 1

    let duration = this.props.selectedVideoInfo.format.duration
    // [lengthSeconds, frameStep]
    let steps = [ [10, 0.1], [60, 1], [180, 10], [Infinity, 50] ]
    
    return steps.find(([maxLength, step]) => duration < maxLength )[1]
  }

  FrameStartIMG = props => (this.props.selectedVideoID && <img id='frameStartIMG' alt='start frame' src={`${this.state.frameCacheAPILocation}${this.props.selectedVideoID}/${this.state.start}`} />) || null

  // takes an array of {id, filename} objects, custom attributes must be lowercase
  ImageGrid = props => <div>{props.data.map((item, index) => <img key={index} onClick={props.onClick} data-gif-id={item.id} alt={index} src={new URL(item.filename, props.srcURLBase)} />)}</div>

  // takes an array of {id, title} objects
  DeleteItemGrid = props => <ul>{props.data.map((item, index) => <li key={index}><button onClick={props.onClick} value={(item.id)}>Delete: {item.title}</button></li>)}</ul>

  render() {
    return (
      <div className='GIF'>

        <div className='section'>
          <div className='flex-container'>
            <div>{/* div required for alignment */}
              <this.FrameStartIMG />
            </div>
            <this.ImageGrid id='frameStartList'
              data={this.videoPreviewFrameTimestamps()}
              srcURLBase={new URL(this.props.selectedVideoID + '/', this.state.frameCacheAPILocation)}
            />
          </div>

          <label>Start at (seconds):
            <input
              type='number'
              name='start'
              value={this.state.start}
              onChange={ev => ev.target.value >= 0 && this.inputStateUpdate(ev)}
            />
            <input
              type='range'
              name='start'
              min={0}
              max={this.props.selectedVideoInfo.format.duration}
              step={this.videoPreviewFrameSteps()}
              value={this.state.start}
              onChange={this.inputStateUpdate}
            />
          </label>
          <label>Length:
            <input
              type='number'
              name='length'
              value={this.state.length}
              onChange={ev => ev.target.value > 0 && this.inputStateUpdate(ev)}
            />
            <input
              type='range'
              name='length'
              min={0.5}
              max={5}
              step={0.1}
              value={this.state.length}
              onChange={this.inputStateUpdate}
            />
          </label>
          <label>Size:
            <input
              type='number'
              name='width'
              value={this.state.width}
              onChange={ev => ev.target.value > 0 && this.inputStateUpdate(ev)}
            />
            <input
              type='range'
              name='width'
              min={50}
              max={500}
              step={50}
              value={this.state.width}
              onChange={this.inputStateUpdate}
            />
          </label>
          <button id='createGIFButton'
            onClick={(ev) => {
              this.putGIF()
              ev.preventDefault()
            }}>Create GIF</button>
        </div>

        <div className='section'>
          <h3>Available GIFs</h3>

          <this.ImageGrid id='availableGIFList'
            data={this.state.displayedGIFList}
            srcURLBase={this.state.gifFileLocation}
            onClick={this.replaceGIFSettings}
          />

          <this.DeleteItemGrid id='deleteGIFList'
            data={this.state.displayedGIFList}
            onClick={(ev) => {
              this.deleteGIF(ev)
              ev.preventDefault()
            }}
          />
        </div>
      </div>
    )
  }
}

export default GIF
