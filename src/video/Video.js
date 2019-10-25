import React, { Component } from 'react'
import './Video.css'


class Video extends Component {
  constructor(props) {
    super(props)
    this.state = {
      frameCacheAPILocation: new URL('frames/', props.backendLocation),
    }
  }

// TODO: update start slider to match the mouse, but dont save until click
  shouldComponentUpdate(nextProps, nextState) {
    // Only reload this component when the video changes or has not yet been loaded    
    if (this.video.readyState === 0 || this.props.selectedVideoID !== nextProps.selectedVideoID) {
      return true;
    }

    // update video position manually to reuse the same video element
    this.video.currentTime = this.props.start
    return false;
  }

  setCurrentTime = event => {
    console.log('video.currentTime', event.target.currentTime)
    // this.props.setStart({start: event.target.currentTime})
    this.props.setStart(event.target.currentTime)
  }

  render() {
    let fileFormat = (this.props.selectedVideoInfo.format.filename) ? this.props.selectedVideoInfo.format.filename.split('.')[1] : 'mp4'
    let type = `video/${fileFormat || 'mp4'}`
    return (
      <div className='Video'>

        <video
          ref={ref=>this.video=ref}
          controls={false}
          preload={true}
          onMouseMove={event=>event.target.currentTime = event.target.duration * ((1 + event.clientX - event.target.offsetLeft) / event.target.offsetWidth)}
          // onMouseMove={event=>console.log((1 + event.clientX - event.target.offsetLeft) * 100 / event.target.offsetWidth)}
          // onTimeUpdate={event=>console.log(event)}
          onClick={this.setCurrentTime}
          src={new URL('videos/' + this.props.selectedVideoID, this.props.backendLocation)} type={type} >
          Your browser does not support the video tag.
        </video>

      </div>
    )
  }
}

export default Video
