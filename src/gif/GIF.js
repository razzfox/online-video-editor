import React, { Component } from 'react'
import './GIF.css'


class GIF extends Component {
  constructor(props) {
    super()

    const backendLocation = 'http://localhost:3080'

    this.state = {
      videoAPILocation: new URL('videos/', backendLocation),
      gifAPILocation: new URL('gifs/', backendLocation),
      // This is currently different for web and electron clients
      gifFileLocation: new URL('gifs/', backendLocation),
      frameCacheAPILocation: new URL('frames/', backendLocation),
      // TODO: make a template function
      // videoInfoLocation: new URL(`${this.state.selectedVideoID}/info/`, videoAPILocation),

      // Note: React does not support nested state objects.
      // the workaround spread operator only works wih one nested level
      // asd react will not update views because it uses shallow comparison

      // seek: number or string format [[hh:]mm:]ss[.xxx]
      start: 0,
      // duration: same formats as above
      length: 1,
      // may be #x# or #x?
      width: '100x',
      loop: true,
      fps: 30,
      bounce: false,

      availableVideoList: [],
      availableGIFList: [],

      // the select element can not have null as a value
      selectedVideoID: props.selectedVideoID || '',
      selectedVideoInfo: {format: {duration: 0}},
    }

    this.getStateUpdate = this.getStateUpdate.bind(this)

    this.inputStateUpdate = this.inputStateUpdate.bind(this)
    this.deleteGIF = this.deleteGIF.bind(this)
  }

  componentDidMount() {
    this.getStateUpdate(this.state.videoAPILocation, 'availableVideoList', () => {
    if(this.state.availableVideoList.length > 0) this.setState({selectedVideoID: this.state.availableVideoList[0].id}, this.updateSelectedVideoInfo )
      // TODO: Update the global state with selectedVideoID
    })
    this.getStateUpdate(this.state.gifAPILocation, 'availableGIFList')
  }

  componentWillUpdate(nextProps, nextState) {
    // TODO: Does this slow react down?
    // if(nextState.availableVideoList !== this.state.availableVideoList) {
    //   console.log('Updated availableVideoList')
    //   console.log('Consider updating selectedVideoID and any computed values here')
    // }
  }

  putGIF() {
    // create body object from the selected video object
    let body = this.state.availableVideoList.find(item => item.id === this.state.selectedVideoID)

    // add properites to body object
    Object.assign(body, {
      // seek: number or string format [[hh:]mm:]ss[.xxx]
      start: this.state.start,
      // duration: same formats as above
      length: this.state.length,
      options: {
        // may be #x# or #x?
        width: this.state.width,
        loop: this.state.loop,
        fps: this.state.fps,
        bounce: this.state.bounce,
      },
    })

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

        // this.getStateUpdate(this.state.gifAPILocation, 'availableGIFList')
        this.setState({availableGIFList: [...this.state.availableGIFList, response]})
    })
    .catch(error => {
      console.error(error)
      // TODO: show an error
    })
  }

  deleteGIF(ev) {
    let gifID = ev.target.getAttribute('value')
    fetch(new URL(gifID, this.state.gifAPILocation), {
      method: 'DELETE',
    }).then(res => res.ok && res)
    .then(response => {
      console.log('Success:', response)
      this.setState({availableGIFList: this.state.availableGIFList.filter(item => item.id !== gifID)})
    })
    .catch(error => {
      console.error(error)
      // TODO: show an error
    })
  }

  getStateUpdate(apiLocation, stateVariable, callback) {
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

  updateSelectedVideoInfo() {
    this.state.selectedVideoID && this.getStateUpdate(new URL(`${this.state.selectedVideoID}/info/`, this.state.videoAPILocation), 'selectedVideoInfo')
  }

  videoPreviewFrameTimestamps() {
    let duration = this.state.selectedVideoInfo ? this.state.selectedVideoInfo.format.duration : 0
    if(duration > 12) duration = 12

  // creates an array of {id, filename} objects
    let previewDegree = 'seconds'
    switch(previewDegree) {
      case 'seconds':
        return Array.from({length: duration}, (value, index) => ({id: index, filename: index}) )
        // break;
      case 'frames':
        return Array.from({length: duration}, (value, index) => ({id: index, filename: `:${index}`}) )
        // break;
      case 'deciseconds':
        return Array.from({length: duration}, (value, index) => ({id: index, filename: index/10}) )
        // break;
      default:
        return []
    }
  }

  inputStateUpdate(ev, stateVariable, callback) {
    if(!stateVariable) stateVariable = ev.target.name || ev.target.id

    console.log(`Changed ${stateVariable} to ${ev.target.value}`)

    this.setState({[stateVariable]: ev.target.value}, callback)
  }

  FrameStartIMG = props => <img id='frameStartIMG' alt='start frame' src={(this.state.selectedVideoID && `${this.state.frameCacheAPILocation}${this.state.selectedVideoID}/${this.state.start}`) || '//:0'}></img>

  // takes an array of {id, title} objects
  DropdownList = props => <select {...props}>{props.data.map((item, index) => <option key={index} value={item.id}>{item.title}</option>)}</select>

  // takes an array of {id, filename} objects
  ImageGrid = props => <div>{props.data.map((item, index) => <img key={index} alt={item.id} src={new URL(item.filename, props.srcURLBase)} />)}</div>

  // takes an array of {id, title} objects
  DeleteItemGrid = props => <ul>{props.data.map((item, index) => <li key={index}><a onClick={props.onClick} value={(item.id)}>Delete: {item.title}</a></li>)}</ul>

  render() {
    // A purely computed value
    const displayedGIFs = this.state.availableGIFList.filter(item => item.videoID === this.state.selectedVideoID)

    return (
      <div className='GIF'>

        <div className='section'>
          <h1 className='intro'>
            Convert a video, Dev: {process.env.NODE_ENV}
          </h1>

          <this.DropdownList
            id='selectedVideoID'
            data={this.state.availableVideoList}
            value={this.state.selectedVideoID}
            onChange={ev => this.inputStateUpdate(ev, this.id, this.updateSelectedVideoInfo)}
          />
        </div>

        {/* TODO: Make a sub component */}
        {/* <this.CreateGIFSettings /> */}
        <div className='section'>
          <this.ImageGrid id='frameStartList'
            data={this.videoPreviewFrameTimestamps()}
            srcURLBase={new URL(this.state.selectedVideoID + '/', this.state.frameCacheAPILocation)}
          />

          <this.FrameStartIMG />
          <label>Start:
            <input
              type='number'
              name='start'
              value={this.state.start}
              onChange={ev => ev.target.value >= 0 && this.inputStateUpdate(ev, this.name)}
            />
          </label>
          <label>Length:
            <input
              type='number'
              name='length'
              value={this.state.length}
              onChange={ev => ev.target.value > 0 && this.inputStateUpdate(ev, this.name)}
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
          <button id='availableGIFButton'
            onClick={(ev) => {
              this.getStateUpdate(this.state.gifAPILocation, 'availableGIFList')
              ev.preventDefault()
            }}>Get Available GIFs</button>

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
