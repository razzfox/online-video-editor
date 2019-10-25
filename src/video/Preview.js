import React, { Component } from 'react'
import './Preview.css'


class Preview extends Component {
  constructor(props) {
    super(props)
    this.state = {
      frameCacheAPILocation: new URL('frames/', props.backendLocation),
    }

    // bind functions that will be called inside the render context
    // reassign context for borrowed functions
  }

  // returns an array of {id, filename}
  videoPreviewFrameTimestamps() {
    let start = Number.parseFloat(this.props.start, 10)

    let length = this.props.selectedVideoInfo.format.duration - start
    length = Number.parseFloat(length.toFixed(1))
    // Note: if frameUnits are greater than the time of the final frame, it will not be shown
    // ex: unit=1s, duration=6.315, last frame seen=6:00

    // max number of frames on screen
    // if(length > 8) length = 8
    length = Math.min(length, 8)

    // decisecond frames
    if(length < 1) return Array.from({length: length*10}, (value, id) => ({id, filename: (id/10) + start}) )
   
    return Array.from({length}, (value, id) => ({id, filename: id + start}) )
  }

  render() {
    return (
      <div className='Preview'>

        <div className='section'>
          <this.props.ImageGrid id='frameStartList'
            data={this.videoPreviewFrameTimestamps()}
            srcURLBase={new URL(this.props.selectedVideoID + '/', this.state.frameCacheAPILocation)}
          />
        </div>

      </div>
    )
  }
}

export default Preview
