import React from 'react'
import Drawing from './drawing-page'
import {
  getMe,
  getUsers,
  initializeGame,
  joinRoom,
  turnListener,
  newGameListener,
  newGame,
  replaceUser,
  partyRoomUnmounted
} from '../socket'
import {UsersBar} from './users-bar'
import {FinalMonster} from './finalMonster'
import swal from '@sweetalert/with-react'
import * as Scroll from 'react-scroll'
import ChatWindow from './chat-window'
import {Instructions} from './instructions'
import axios from 'axios'

export class PartyRoom extends React.Component {
  constructor() {
    super()
    this.state = {
      userTurn: {},
      users: [],
      me: '',
      done: 0,
      bodyPartsImage: [],
      bodyParts: ['head', 'torso', 'legs', 'feet'],
      connectingLines: '',
      gamePlay: false,
      finished: false,
      hasClicked: false,
      clickLocation: '',
      chatMessages: [],
      saved: false,
      timer: true
    }

    this.canvas = React.createRef()
    this.handleDownload = this.handleDownload.bind(this)
    this.handleTurn = this.handleTurn.bind(this)
    this.handleUsers = this.handleUsers.bind(this)
    this.handleMyself = this.handleMyself.bind(this)
    this.gameStart = this.gameStart.bind(this)
    this.handleFinish = this.handleFinish.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleTooManyPlayers = this.handleTooManyPlayers.bind(this)
    this.addMessage = this.addMessage.bind(this)
    this.displayInstructions = this.displayInstructions.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleNewGame = this.handleNewGame.bind(this)
    this.handleTimer = this.handleTimer.bind(this)
    this.handlePlayerDisconnecting = this.handlePlayerDisconnecting.bind(this)
    this.setNewUsers = this.setNewUsers.bind(this)
    this.handlePlayerLeavingEarly = this.handlePlayerLeavingEarly.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
  }

  componentDidMount() {
    //joins the room via link
    joinRoom(
      this.props.match.params.room,
      this.addMessage,
      this.handleTooManyPlayers,
      this.props.location.state,
      this.handleTimer,
      this.handlePlayerDisconnecting,
      this.setNewUsers
    )

    //gets all users + listens for more
    getUsers(this.handleUsers, this.props.match.params.room)

    //gets my nickname
    getMe(this.handleMyself)

    //listening for turns being done
    turnListener(this.handleTurn, this.handleFinish)

    //listening for Game Start
    initializeGame(this.gameStart)

    //listening for New Game
    newGameListener(this.handleNewGame)

    window.addEventListener('beforeunload', this.handlePlayerLeavingEarly)
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handlePlayerLeavingEarly)
    partyRoomUnmounted()
  }

  handlePlayerLeavingEarly(e) {
    e.preventDefault()
    e.returnValue = ''
  }

  //displays instructions
  displayInstructions() {
    this.state.users.length <= 4 && swal(<Instructions />)
  }

  handleTooManyPlayers() {
    swal('Sorry, room is full!', 'Only four players allowed :(', 'warning')
    this.props.history.push(`/home`)
  }

  displayInstructions() {
    this.state.users.length <= 4 && swal(<Instructions />)
  }

  handleUsers(users) {
    this.setState({users: users})
  }

  handleMyself(me) {
    this.setState({me: me})
  }

  handleDownload() {
    const img = this.canvas.current.toDataURL()
    this.downloadURI(img, `${this.props.match.params.room}-corpse.png`)
  }

  downloadURI(uri, name) {
    let link = document.createElement('a')
    link.download = name
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  gameStart(users) {
    this.setState({users: users, userTurn: users[0], gamePlay: true})
  }

  handleTurn(limbs, leadingLines, numberFinished) {
    this.setState(prevState => {
      return {
        done: numberFinished,
        userTurn: prevState.users[numberFinished % prevState.users.length],
        bodyPartsImage: [...prevState.bodyPartsImage, limbs],
        connectingLines: leadingLines
      }
    })
  }

  handleFinish() {
    this.setState({gamePlay: false, finished: true})
  }

  handleNewGame() {
    this.setState({
      userTurn: this.state.users[0],
      finished: false,
      gamePlay: true,
      connectingLines: '',
      done: 0,
      bodyPartsImage: []
    })
  }
  //click functions to stop line runoff while drawing on drawing-page
  handleMouseDown(e) {
    this.setState({
      hasClicked: true,
      clickLocation: e.target.nodeName
    })
  }

  handleMouseUp() {
    this.setState({
      hasClicked: false
    })
  }

  handlePlayerDisconnecting(droppedPlayerId) {
    console.log('GOT DISCONNECT FOR: ', droppedPlayerId)
    const room = this.props.match.params.room
    replaceUser(room, this.state.users, droppedPlayerId)
  }

  setNewUsers(remainingUsers) {
    this.setState(prevState => {
      return {
        users: remainingUsers,
        userTurn: remainingUsers[prevState.done]
      }
    })
  }

  addMessage(message) {
    this.setState(prevState => ({
      chatMessages: [...prevState.chatMessages, message]
    }))
    this.scrollToBottom()
  }

  async handleSave() {
    if (this.state.saved) return
    this.setState({saved: true})
    const img = this.canvas.current.toDataURL()
    await axios.post('/api/', {
      name: this.props.match.params.room,
      imageUrl: img
    })
  }

  handleTimer(time) {
    this.setState(time)
  }

  scrollToBottom() {
    Scroll.animateScroll.scrollToBottom({
      containerId: 'chat-messages',
      delay: 0,
      duration: 100
    })
  }

  render() {
    const myself = this.state.me
    const userTurn = this.state.userTurn || {}
    const room = this.props.match.params.room

    return (
      <div
        id="party-room"
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
      >
        <div id="room-name">Room: {this.props.match.params.room}</div>

        {this.state.gamePlay ? (
          <div className="header-turn-info">
            {this.state.me.id === userTurn.id
              ? `It's your turn! Draw the
            ${this.state.bodyParts[this.state.done]}!`
              : `It's ${userTurn.nickname}'s turn! Drawing the
            ${this.state.bodyParts[this.state.done]}...`}
          </div>
        ) : this.state.finished ? (
          ''
        ) : (
          <div className="header-turn-info">
            Waiting for {4 - this.state.users.length} more players!
          </div>
        )}

        <div id="main-party-room-area">
          <div id="users-section">
            <UsersBar
              users={this.state.users}
              userTurn={this.state.userTurn}
              id="users-bar"
            />
            <button
              className="instructions-button-party-room"
              type="button"
              onClick={this.displayInstructions}
            >
              Instructions
            </button>
          </div>
          <div id="party-room-center">
            {this.state.gamePlay ? (
              <div id="party-room-canvas">
                {/* It is {userTurn.nickname}'s turn! Drawing the{' '}
                {this.state.bodyParts[this.state.done]} */}
                {myself.id === userTurn.id ? (
                  <Drawing
                    canvas={this.canvas}
                    userTurn={this.state.done}
                    room={room}
                    connectingLines={this.state.connectingLines}
                    hasClicked={this.state.hasClicked}
                    clickLocation={this.state.clickLocation}
                    timer={this.state.timer}
                  />
                ) : (
                  ''
                )}
              </div>
            ) : (
              <div>
                {this.state.finished ? (
                  <div id="finalMonster">
                    <FinalMonster
                      bodyParts={this.state.bodyPartsImage}
                      canvas={this.canvas}
                    />
                    <div id="buttons-below-canvas">
                      <button type="button" onClick={this.handleDownload}>
                        Download
                      </button>
                      <button type="button" onClick={this.handleSave}>
                        {this.state.saved ? 'Saved!' : 'Save to Gallery'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          newGame(room)
                        }}
                      >
                        New Game
                      </button>
                    </div>
                  </div>
                ) : (
                  <div id="party-room-canvas">
                    <Instructions />
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <ChatWindow
              messages={this.state.chatMessages}
              room={room}
              me={this.state.me}
            />
          </div>
        </div>
      </div>
    )
  }
}
