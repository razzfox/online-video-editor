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

  componentDidMount() {
    // first time selectedVideoID
    // if(this.props.selectedVideoID) this.updateAvailableGIFList()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // react to change to selectedVideoID
    // if(prevProps.selectedVideoID !== this.props.selectedVideoID) this.updateAvailableGIFList()
  }

  videoPreviewFrameTimestamps() {
    if(!this.props.selectedVideoID) return []

    // let start = Number.parseFloat(this.state.start, 10)
    // use integers to keep preview frames at regular intervals
    let start = Number.parseInt(this.props.start, 10)

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

  FrameStartIMG = props => (this.props.selectedVideoID && <img id='frameStartIMG' alt='start frame' src={`${this.state.frameCacheAPILocation}${this.props.selectedVideoID}/${this.props.start}`} />) || null

  render() {
    return (
      <div className='Preview'>

        <div className='section'>
          <div className='flex-container'>
            <div>{/* div required for alignment */}
              <this.FrameStartIMG />
            </div>
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
