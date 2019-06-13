import React, { Component } from 'react';
import './GIF.css';

// gifAPI for reference:
// router.post('/videoInfo', postVideoInfo)
// router.put('/gif', putVideoToGIF)
// router.get('/gif', getGIFList)
// router.get('/gif/:gifID', getGIFInfo)
// router.delete('/gif/:gifID', deleteGIF)
// router.post('/frameCache', postFrameCache)
// router.delete('/frameCache/:videoID', deleteFrameCache)
// router.post('/gifcache', postGIFCache)
// router.delete('/gifcache/:videoID', deleteGIFCache)


// Note about mobile apps:
// ffmpeg may not be available
// implement a remote ffmpeg server


class GIF extends Component {
  constructor(props) {
    super()

    const backendLocation = 'http://localhost:3080'

    this.state = {
      videoAPILocation: new URL('video/', backendLocation),
      gifAPILocation: new URL('gif/', backendLocation),
      // This is currently different for web and electron clients
      gifFileLocation: new URL('gifs/', backendLocation),
      frameCacheAPILocation: new URL('frameCache/', backendLocation),

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
    }

    this.getStateUpdate = this.getStateUpdate.bind(this)

    this.inputStateUpdate = this.inputStateUpdate.bind(this)
    this.deleteGIF = this.deleteGIF.bind(this)
  }

  componentDidMount() {
    this.getStateUpdate(this.state.videoAPILocation, 'availableVideoList', () => {
      if(this.state.availableVideoList.length > 0) this.setState({selectedVideoID: this.state.availableVideoList[0].id})
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
    }).then(res => res.ok && res.json())
    .then(response => {
      console.log('Success:', response)

      // this.getStateUpdate(this.state.gifAPILocation, 'availableGIFList')
      this.setState({availableGIFList: [...this.state.availableGIFList, response]})
    })
    .catch(error => {
      console.error('Error:', error)
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
      this.setState({availableGIFList: this.state.availableGIFList.filter(item => item.gifID !== gifID)})
    })
    .catch(error => {
      console.error('Error:', error)
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

  inputStateUpdate(ev, stateVariable, callback) {
    console.log(`Changed ${stateVariable} to ${ev.target.value}`)

    this.setState({[stateVariable]: ev.target.value}, callback)
  }

  // {/* TODO: make startFrameSource a caching function (memoize) */}
  FrameStartIMGList = props => <img id='#startFrameIMG' alt='start frame' src={(this.state.selectedVideoID && `${this.state.frameCacheAPILocation}${this.state.selectedVideoID}/${this.state.start}`) || '//:0'}></img>

  CreateGIFSettings = props => (
    <div className='section'>
      <this.FrameStartIMGList />
      <label>Start:
        <input
          type='number'
          name='start'
          value={this.state.start}
          onChange={(ev) => {
            if(ev.target.value < 0) return
            this.inputStateUpdate(ev, 'start')
          }}
        />
      </label>
      <label>Length:
        <input
          type='number'
          name='length'
          value={this.state.length}
          onChange={(ev) => {
            if(ev.target.value < 0) return
            this.inputStateUpdate(ev, 'length')
          }}
        />
      </label>
      <button id='createGIFButton'
        onClick={(ev) => {
          this.putGIF()
          ev.preventDefault()
        }}>Create GIF</button>
    </div>
  )

  // takes an array of items, with {id, name} properties
  DropDownList = props => <select value={props.value} onChange={props.onChange}>{props.data.map((item, index) => <option key={index} value={item.id}>{item.title}</option>)}</select>

  ImageGrid = props => <div>{props.data.map((item, index) => <img key={index} alt={item.id} src={new URL(item.filename, props.srcURLBase)} />)}</div>

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

          <this.DropDownList
            data={this.state.availableVideoList}
            value={this.state.selectedVideoID}
            onChange={(ev) => this.inputStateUpdate(ev, 'selectedVideoID')}
          />
        </div>

        {/* TODO: Make a sub component */}
        <this.CreateGIFSettings />

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
