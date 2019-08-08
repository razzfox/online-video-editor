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

  videoPreviewFrameTimestamps() {
    // if(!this.props.selectedVideoInfo.format.duration) return []

    let start = Number.parseFloat(this.props.start, 10)
    // let start = this.props.start

    // length is not longer than the duration minus the start time
    let length = Number.parseFloat(this.props.selectedVideoInfo.format.duration, 10) - start

    // if frameUnits are greater than the time of the final frame, it will not be seen
    // ex: unit=1s, duration=6.315, last frame seen=6:00

    // fixed decimal point
    length = Number.parseFloat(length.toFixed(1))

    // max number of frames on screen
    // if(length > 8) length = 8
    length = Math.min(length, 8)

    // creates an array of {id, filename} objects
    if(length < 1) return Array.from({length: length*10}, (value, id) => ({id, filename: (id/10) + start}) )
    else return Array.from({length}, (value, id) => ({id, filename: id + start}) )
  }

  render() {
    return (
      <div className='Preview'>

        <div className='section'>
          <div className='flex-container'>
            <this.props.ImageGrid id='frameStartList'
              data={this.videoPreviewFrameTimestamps()}
              srcURLBase={new URL(this.props.selectedVideoID + '/', this.state.frameCacheAPILocation)}
            />
          </div>
        </div>

      </div>
    )
  }
}

export default Preview
