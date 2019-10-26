import React, { Component } from 'react'
import './Clip.css'
import Video from './Video';


class Clip extends Component {
  constructor(props) {
    super(props)
    this.state = {
      clipAPILocation: new URL('clips/', props.backendLocation),
      // TODO: ClipFileLocation is different for web and electron clients
      clipFileLocation: new URL('clips/', props.backendLocation),

      availableClipList: [],
      displayedClipList: [],

      frameStepUnit: this.frameStepUnit(),

      // Note: React does not support nested state objects.
      // react will not update views because it uses shallow comparison.
      bounce: false,
      fps: 30,
      // time format: number or string format [[hh:]mm:]ss[.xxx]
      length: 3,
      lengthMax: 5,
      loop: true,
      start: 0,
      // may be #x# or #x?
      width: '400',
    }

    // bind functions that will be called inside the render context
    this.putClip = this.putClip.bind(this)
    this.deleteClip = this.deleteClip.bind(this)
    this.replaceClipSettings = this.replaceClipSettings.bind(this)
    // reassign context for borrowed functions
    this.fetchStateUpdate = props.fetchStateUpdate.bind(this)
    this.inputStateUpdate = props.inputStateUpdate.bind(this)
  }

  componentDidMount() {
    // always fetch
    this.updateAvailableClipList()

    if(this.state.start > this.props.selectedVideoInfo.format.duration)
      this.setState({ start: 0, lengthMax: 5 })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // selectedVideoID
    if(prevProps.selectedVideoID !== this.props.selectedVideoID)
      this.updateAvailableClipList()
    
    // availableClipList: these are independent because a new video could have new clips
    if(prevState.availableClipList !== this.state.availableClipList)
      this.updateDisplayedClipList()

    // duration or start
    if(prevProps.selectedVideoInfo !== this.props.selectedVideoInfo
      || prevState.start !== this.state.start) {
        this.setState((state, props) => {
          const length = props.selectedVideoInfo.format.duration - state.start
          if(length <= 0) {
            return {
              start: 0,
              lengthMax: 5,
              length: 1,
            }
          }
        })

      }
    // duration
    if(prevProps.selectedVideoInfo !== this.props.selectedVideoInfo){
      this.setState({ frameStepUnit: this.frameStepUnit() })
    }
  }

  // Note: deriving one state value from another requires using a (state, props) => function
  updateDisplayedClipList = () => this.setState((state, props) => ({ displayedClipList: state.availableClipList.filter(item => item.videoID === props.selectedVideoID) }) )

  updateAvailableClipList = () => this.fetchStateUpdate(this.state.clipAPILocation, 'availableClipList')

  putClip() {
    const {bounce, fps, length, loop, start} = this.state
    // add properties to body object
    const body = {
      id: this.props.selectedVideoID,
      start,
      length,
      options: {
        bounce,
        fps,
        loop,
        width: `${this.state.width}x?`, // may be '#x#' or '#x?'
      },
    }

    fetch(this.state.clipAPILocation, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body), // body data type must match 'Content-Type' header
    }).then(res => {
      if(res.redirected) {
        let msg = 'Clip already exists:'
        throw new Error(msg)
      } else {
        return res.json()
      }
    })
    .then(response => {
      // Redirect because resource already exists
      console.log('Created Clip', response)
      // Since state changes are asynchronous, the values resolved by this.state
      // when this function is called could already be stale values.
      // Use callback setState( (state, props) => ({ propA: state.propB + 1 }) )    
      this.setState((state, props) => ({availableClipList: [...state.availableClipList, response]}) )
    })
    .catch(error => console.error(error) )
  }

  deleteClip(event) {
    const itemID = event.target.getAttribute('value')
    fetch(new URL(itemID, this.state.clipAPILocation), {
      method: 'DELETE',
    }).then(res => res.ok && res)
    .then(response => {
      console.log('Deleted Clip', response)
      this.setState((state, props) => ({availableClipList: state.availableClipList.filter(item => item.id !== itemID)}) )
    })
    .catch(error => console.error(error) )
  }

  replaceClipSettings(event) {
    const itemID = event.target.getAttribute('data-item-id')
    const item = this.state.displayedClipList.find(item => item.id === itemID)
    if(! item || ! item.clipSettings) {
      console.error('clip settings not replaced', item)
      return
    }

    const width = item.clipSettings.width.split('x')[0]
    this.setState({ ...item.clipSettings, width })
  }

  setStart = start => this.setState({ start })

  // [maxLength, step] in seconds
  frameStepUnit = () => [ [10, 0.1], [60, 1], [180, 10], [Infinity, 50] ].find(([maxLength, step]) => this.props.selectedVideoInfo.format.duration <= maxLength )[1]

  // takes an array of {id, filename} objects, custom attributes must be lowercase
  ImageGrid = props => <ul>{props.data.map((item, index) => <li key={index}><img key={index} onClick={props.onClick} data-item-id={item.id} alt={index} src={new URL(item.filename, props.srcURLBase)} />{(props.onDeleteClick) && <button onClick={props.onDeleteClick} value={(item.id)}>Delete clip</button>}</li>)}</ul>

  // takes an array of {id, title} objects
  DeleteItemGrid = props => <ul>{props.data.map((item, index) => <li key={index}><img key={index} onClick={props.onClick} data-item-id={item.id} alt={index} src={new URL(item.filename, props.srcURLBase)} />{(props.onDeleteClick) && <button onClick={props.onDeleteClick} value={(item.id)}>Delete clip</button>}</li>)}</ul>

  render() {
    return (
      <div className='Clip'>

        <div className='section'>
          <Video
            backendLocation={this.props.backendLocation}
            selectedVideoID={this.props.selectedVideoID}
            selectedVideoInfo={this.props.selectedVideoInfo}
            start={this.state.start}
            setStart={this.setStart}
            step={this.state.frameStepUnit}
          />

          <label>Start clip (seconds):
            <input
              type='number'
              name='start'
              min={0}
              max={this.props.selectedVideoInfo.format.duration}
              step={1}
              value={this.state.start}
              onChange={ev => ev.target.value >= 0 && this.inputStateUpdate(ev)}
            />
          </label>
          <input
            type='range'
            name='start'
            min={0}
            max={this.props.selectedVideoInfo.format.duration}
            step={this.state.frameStepUnit}
            value={this.state.start}
            onChange={this.inputStateUpdate}
          />
          <label>Length (seconds):
            <input
              type='number'
              name='length'
              min={0.5}
              max={this.state.lengthMax}
              step={0.1}
              value={this.state.length}
              onChange={ev => ev.target.value > 0 && this.inputStateUpdate(ev)}
            />
          </label>
          <input
            type='range'
            name='length'
            min={0.5}
            max={this.state.lengthMax}
            step={0.1}
            value={this.state.length}
            onChange={this.inputStateUpdate}
          />
          <label>Width (pixels):
            <input
              type='number'
              name='width'
              step={10}
              value={this.state.width}
              onChange={ev => ev.target.value > 0 && this.inputStateUpdate(ev)}
            />
          </label>
          <input
            type='range'
            name='width'
            min={50}
            max={500}
            step={50}
            value={this.state.width}
            onChange={this.inputStateUpdate}
          />
          <button id='createClipButton'
            onClick={(ev) => {
              this.putClip()
              ev.preventDefault()
            }}>Create Clip</button>
        </div>

        <div className='section'>
          <h3>Available Clips</h3>

          <this.DeleteItemGrid id='availableClipList'
            data={this.state.displayedClipList}
            srcURLBase={this.state.clipFileLocation}
            onClick={this.replaceClipSettings}
            onDeleteClick={e => {
              this.deleteClip(e)
              e.preventDefault()
            }}
          />
        </div>
      </div>
    )
  }
}

export default Clip
