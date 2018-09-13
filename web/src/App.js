import React, { Component } from 'react'
import styled from 'styled-components'
import SimpleWebRTC from 'simplewebrtc'
import freeice from 'freeice'

import Microphone from './icons/Microphone'
import Video from './icons/Video'
import ShareScreen from './icons/ShareScreen'
import ChangeRoom from './icons/ChangeRoom'

const Base = styled.main`
  background-color: black;
  height: 100%;
  display: grid;
  grid-template-areas:
    'header header'
    'remote remote'
    'local .';
  grid-template-rows: 4em 1fr calc(150px + 1em);
  grid-template-columns: calc(200px + 1em) 1fr;
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
  grid-column: 1/-1;
  grid-row: 3;
  display: grid;
  grid-gap: 1em;
  grid-auto-flow: column;
  align-self: end;
  justify-self: center;
  background: aliceblue;
  padding: 0.75em;
  margin-bottom: 0.5em;
  border-radius: 22px;
  z-index: 1;
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
  object-fit: contain;
  object-position: right;
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
const PlainButton = styled.button`
  border: none;
  background: none;
  appearance: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
`
const initialParams = new URLSearchParams(window.location.search)
const initialRoom = initialParams.get('room') || 'lobby'

class App extends Component {
  state = {
    room: initialRoom,
    sharingAudio: true,
    sharingVideo: true,
    sharingScreen: false,
  }
  webrtc = new SimpleWebRTC({
    localVideoEl: 'localVideo',
    remoteVideosEl: 'remotesVideos',
    autoRequestMedia: true,
    url: window.location.origin,
    peerConnectionConfig: freeice(),
  })
    .on('connectionReady', id => {
      this.setState({
        connectionId: id,
      })
    })
    .on('readyToCall', () => {
      this.webrtc.joinRoom(initialRoom)
      this.setState({
        readyToCall: true,
      })
    })
  handleChangeShareAudio = ({ target }) => {
    const sharingAudio = target.checked
    this.setState({ sharingAudio })
    if (sharingAudio) {
      this.webrtc.unmute()
    } else {
      this.webrtc.mute()
    }
  }
  handleChangeShareVideo = ({ target }) => {
    const sharingVideo = target.checked
    this.setState({ sharingVideo })
    if (sharingVideo) {
      this.webrtc.resumeVideo()
    } else {
      this.webrtc.pauseVideo()
    }
  }
  handleChangeShareScreen = ({ target }) => {
    const sharingScreen = target.checked
    this.setState({ sharingScreen })
    if (!sharingScreen) {
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
  handleChangeRoom = () => {
    let newRoom = window.prompt('What room would you like to join?')
    if (newRoom == null || newRoom.trim() === '') return
    this.webrtc.leaveRoom(this.state.room)
    newRoom = newRoom.trim()
    this.webrtc.joinRoom(newRoom, err => {
      if (err) {
        alert(`Failed to join room: ${err}`)
        return
      }
      this.setState({ room: newRoom })
      const params = new URLSearchParams(window.location.search)
      params.set('room', newRoom)
      window.history.pushState(
        {
          room: newRoom,
        },
        newRoom,
        `?${params.toString()}`
      )
    })
  }
  render() {
    const { room, readyToCall } = this.state
    const { supportScreenSharing } = this.webrtc.capabilities
    return (
      <Base>
        <Header>
          <h1>DDT Chat</h1>
          <small>{readyToCall ? `Connected - ${room}` : 'Connecting...'}</small>
        </Header>
        <LocalVideo id="localVideo" />
        <RemoteVideos id="remotesVideos" />
        <Controls>
          <input
            id="share-audio"
            type="checkbox"
            onChange={this.handleChangeShareAudio}
            checked={this.state.sharingAudio}
          />
          <label
            htmlFor="share-audio"
            title={
              this.state.sharingAudio
                ? 'Stop sharing audio'
                : 'Start sharing audio'
            }>
            <Microphone active={this.state.sharingAudio} />
          </label>
          <input
            id="share-video"
            type="checkbox"
            onChange={this.handleChangeShareVideo}
            checked={this.state.sharingVideo}
          />
          <label
            htmlFor="share-video"
            title={
              this.state.sharingAudio
                ? 'Stop sharing video'
                : 'Start sharing video'
            }>
            <Video active={this.state.sharingVideo} />
          </label>
          <input
            id="share-screen"
            type="checkbox"
            onChange={this.handleChangeShareScreen}
            checked={this.state.sharingScreen}
            disabled={!supportScreenSharing}
          />
          <label
            htmlFor="share-screen"
            title={
              !supportScreenSharing
                ? 'Screen sharing not available.'
                : this.state.sharingScreen
                  ? 'Stop sharing your screen'
                  : 'Start sharing your screen'
            }>
            <ShareScreen
              active={this.state.sharingScreen}
              disabled={!supportScreenSharing}
            />
          </label>
          <PlainButton onClick={this.handleChangeRoom} title="Change rooms">
            <ChangeRoom />
          </PlainButton>
        </Controls>
      </Base>
    )
  }
}

export default App
