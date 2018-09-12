import React, { Component } from 'react'
import styled from 'styled-components'
import SimpleWebRTC from 'simplewebrtc'
import freeice from 'freeice'

const Base = styled.main`
  background-color: black;
  height: 100%;
  display: grid;
  grid-template-areas:
    'header header header'
    'remote remote remote'
    'local controls .';
  grid-template-rows: 4em 1fr calc(150px + 1em);
  grid-template-columns: calc(200px + 1em) 1fr calc(200px + 1em);
`
const Header = styled.header`
  grid-area: header;
  background-color: #222;
  padding: 0.5em;
  color: white;
  text-align: center;
  small {
    position: absolute;
    right: 1em;
    top: 1em;
  }
  h1 {
    font-size: 1.5em;
    color: white;
  }
`
const Controls = styled.section`
  display: grid;
  grid-gap: 1em;
  grid-auto-flow: column;
  align-self: end;
  justify-self: center;
  background: aliceblue;
  padding: 0.75em;
  margin-bottom: 0.5em;
  border-radius: 22px;
  input {
    position: absolute;
    opacity: 0;
  }
  label {
    cursor: pointer;
  }
`
const LocalVideo = styled.video`
  grid-area: local;
  width: 200px;
  height: 150px;
  margin: 0.5em;
`
const RemoteVideos = styled.section`
  grid-area: remote;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-grow: 1;
  video {
    max-width: 100%;
  }
  #localScreen {
    position: absolute;
    bottom: 1em;
    right: 1em;
    max-width: 50vw;
  }
`

class App extends Component {
  state = {
    sharingScreen: false,
  }
  componentDidMount() {
    const webrtc = (this.webrtc = new SimpleWebRTC({
      localVideoEl: 'localVideo',
      remoteVideosEl: 'remotesVideos',
      autoRequestMedia: true,
      url:
        process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:8888',
      peerConnectionConfig: freeice(),
    }))
    webrtc.on('connectionReady', id => {
      this.setState({
        connectionId: id,
      })
    })
    webrtc.on('readyToCall', () => {
      webrtc.joinRoom('lobby')
      this.setState({
        readyToCall: true,
      })
    })
  }
  handleChangeShareScreen = ({ target }) => {
    this.setState({ sharingScreen: target.checked })
    if (!target.checked) {
      this.webrtc.stopScreenShare()
      return
    }
    this.webrtc.shareScreen(err => {
      if (err) {
        this.setState({ sharingScreen: false })
        if (err.name === 'NotAllowedError') {
          return
        }
        alert(`Failed to share screen: ${err.name}`)
      }
    })
  }
  render() {
    const { readyToCall } = this.state
    return (
      <Base>
        <Header>
          <h1>DDT Chat</h1>
          <small>{readyToCall ? 'Connected' : 'Connecting...'}</small>
          <label>
            Share screen
            <input
              type="checkbox"
              onChange={this.handleChangeShareScreen}
              checked={this.state.sharingScreen}
            />
          </label>
        </Header>
        <LocalVideo id="localVideo" />
        <RemoteVideos id="remotesVideos" />
      </Base>
    )
  }
}

export default App
