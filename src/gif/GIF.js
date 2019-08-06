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

      // Note: React does not support nested state objects.
      // react will not update views because it uses shallow comparison.

      // seek: number or string format [[hh:]mm:]ss[.xxx]
      start: 0,
      // duration: same formats as above
      length: 1,
      // may be #x# or #x?
      width: '200',
      loop: true,
      fps: 30,
      bounce: false,
    }

    this.fetchStateUpdate = props.fetchStateUpdate.bind(this)
    this.inputStateUpdate = props.inputStateUpdate.bind(this)
    this.putGIF = this.putGIF.bind(this)
    this.deleteGIF = this.deleteGIF.bind(this)
  }

  componentDidMount() {
    // first time selectedVideoID
    if(this.props.selectedVideoID) this.updateAvailableGIFList()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // react to change to selectedVideoID
    if(prevProps.selectedVideoID !== this.props.selectedVideoID) this.updateAvailableGIFList()
  }

  updateAvailableGIFList = () => this.fetchStateUpdate(this.state.gifAPILocation, 'availableGIFList')

  putGIF() {
    // add properties to body object
    const body = {
      id: this.props.selectedVideoID,
      // seek: number or string format [[hh:]mm:]ss[.xxx]
      start: this.state.start,
      // duration: same formats as above
      length: this.state.length,
      options: {
        // may be '#x#' or '#x?'
        width: `${this.state.width}x?`,
        loop: this.state.loop,
        fps: this.state.fps,
        bounce: this.state.bounce,
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
        console.log('Success:', response)
        // Since state changes are asynchronous, the values resolved by this.state
        // when this function is called could already be stale values.
        // Use callback setState( (state, props) => ({ propA: state.propB + 1 }) )    
        this.setState((state, props) => ({availableGIFList: [...state.availableGIFList, response]}))
    })
    .catch(error => {
      console.error(error)
      // TODO: show an error
    })
  }

  deleteGIF(event) {
    let gifID = event.target.getAttribute('value')
    fetch(new URL(gifID, this.state.gifAPILocation), {
      method: 'DELETE',
    }).then(res => res.ok && res)
    .then(response => {
      console.log('Success:', response)
      this.setState((state, props) => ({availableGIFList: state.availableGIFList.filter(item => item.id !== gifID)}))
    })
    .catch(error => {
      console.error(error)
      // TODO: show an error
    })
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

  // takes an array of {id, filename} objects
  ImageGrid = props => <div>{props.data.map((item, index) => <img key={index} alt={item.id} src={new URL(item.filename, props.srcURLBase)} />)}</div>

  // takes an array of {id, title} objects
  DeleteItemGrid = props => <ul>{props.data.map((item, index) => <li key={index}><a onClick={props.onClick} value={(item.id)}>Delete: {item.title}</a></li>)}</ul>

  render() {
    // A purely computed value
    const displayedGIFs = this.state.availableGIFList.filter(item => item.videoID === this.props.selectedVideoID)

    return (
      <div className='GIF'>

        <div className='section'>
          <div className='flex-container'>
            <div>{/* div requried for alignment */}
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
          <a>Available GIFs</a>

          <this.ImageGrid id='availableGIFList'
            data={displayedGIFs}
            srcURLBase={this.state.gifFileLocation}
          />

          <this.DeleteItemGrid id='deleteGIFList'
            data={displayedGIFs}
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
