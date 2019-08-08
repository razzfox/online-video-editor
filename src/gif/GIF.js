import React, { Component } from 'react'
import './GIF.css'
import Preview from './Preview';


class GIF extends Component {
  constructor(props) {
    super(props)
    this.state = {
      gifAPILocation: new URL('gifs/', props.backendLocation),
      // TODO: gifFileLocation is different for web and electron clients
      gifFileLocation: new URL('gifs/', props.backendLocation),

      availableGIFList: [],
      displayedGIFList: [],

      frameStepUnit: 1,

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
    this.updateAvailableGIFList()

    if(this.props.selectedVideoInfo && this.state.start > this.props.selectedVideoInfo.format.duration)
      this.setState({ start: 0 })
    if(this.props.selectedVideoInfo)
      this.setState({ frameStepUnit: this.frameStepUnit() })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // react to change to selectedVideoID
    if(prevProps.selectedVideoID !== this.props.selectedVideoID)
      this.updateAvailableGIFList()
    // react to change to selectedVideoInfo
    if(prevProps.selectedVideoInfo !== this.props.selectedVideoInfo && this.state.start > this.props.selectedVideoInfo.format.duration)
      this.setState({ start: 0 })
    if(prevProps.selectedVideoInfo !== this.props.selectedVideoInfo)
      this.setState({ frameStepUnit: this.frameStepUnit() })
    // these are independent because a new video could have new gifs
    if(prevState.availableGIFList !== this.state.availableGIFList)
      this.updateDisplayedGIFList()
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
        loop,
        width: `${this.state.width}x?`, // may be '#x#' or '#x?'
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
    .catch(error => console.error(error) )
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
    .catch(error => console.error(error) )
  }

  replaceGIFSettings(event) {
    const gifID = event.target.getAttribute('data-gif-id')
    const gifItem = this.state.displayedGIFList.find(item => item.id === gifID)
    const width = gifItem.gifSettings.width.split('x')[0]
    this.setState({ ...gifItem.gifSettings, width })
  }

  // [maxLength, step] in seconds
  frameStepUnit = () => [ [10, 0.1], [60, 1], [180, 10], [Infinity, 50] ].find(([maxLength, step]) => this.props.selectedVideoInfo.format.duration <= maxLength )[1]

  // takes an array of {id, filename} objects, custom attributes must be lowercase
  ImageGrid = props => <div>{props.data.map((item, index) => <img key={index} onClick={props.onClick} data-gif-id={item.id} alt={index} src={new URL(item.filename, props.srcURLBase)} />)}</div>

  // takes an array of {id, title} objects
  DeleteItemGrid = props => <ul>{props.data.map((item, index) => <li key={index}><button onClick={props.onClick} value={(item.id)}>Delete: {item.title}</button></li>)}</ul>

  render() {
    return (
      <div className='GIF'>

        <div className='section'>
          <Preview
            backendLocation={this.props.backendLocation}
            selectedVideoID={this.props.selectedVideoID}
            selectedVideoInfo={this.props.selectedVideoInfo}

            start={this.state.start}
            step={this.state.frameStepUnit}
            ImageGrid={this.ImageGrid}
          />

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
              step={this.state.frameStepUnit}
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
