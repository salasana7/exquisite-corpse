import io from 'socket.io-client'

const socket = io(window.location.origin)

socket.on('connect', () => {
  console.log('Connected!')
})

export function createRoom(callback, name) {
  socket.emit('roomCreate')
  setName(name)
  socket.on('roomCreated', callback)
}

export function setName(name) {
  socket.emit('set-nickname', name)
}

export function leaveRoom(callback) {
  socket.off('roomCreated', callback)
}

export function joinRoom(room) {
  socket.emit('joinedRoom', room)
}

export function getUsers(callback, room) {
  socket.on('getUsers', callback)
  socket.emit('users', room)
}

export function getMe(callback) {
  socket.emit('getMe')
  socket.on('nickname', callback)
}

export function newLine(arr, room) {
  socket.emit('newLines', arr, room)
}

//broadcast all lines
export function broadcastLines(callback) {
  socket.on('linesToState', callback)
}

//listen for turns
export function turnListener(callback, finishedCallback) {
  socket.on('done', callback)
  socket.on('finished', finishedCallback)
}

//finish drawing function
export function doneDrawing(num, room, limbs, leadingLines) {
  socket.emit('doneDrawing', num, room, limbs, leadingLines)
}

export function initializeGame(callback) {
  socket.on('gameStart', callback)
}

export default socket
