import { v4 as uuidV4 } from 'uuid';

// type CHANNELS = {
//     state: { shared: {}, peers: {} }
//     sockets: { [connectedSocket: WebSocket]: any }
// }
const CHANNELS = {};

function reportError(err) {
  console.log(err);
}

/** Sends a message to a specific socket */
function sendMessageToPeer(message, websocket) {
  if (!message) return;

  let messageData;
  try {
    messageData = JSON.stringify(message);
  } catch (e) { reportError(e); }

  if (websocket) {
    try {
      websocket.send(messageData);
    } catch (e) { reportError(e); }
  }
}

/** Sends a message to every socket in a channel */
function sendMessageToChannel(message) {
  if (!message) return;
  let channel = [];

  let messageData;
  try {
    messageData = JSON.stringify(message);
    // Identify the channel relevant for the message
    channel = CHANNELS[message.channel];
  } catch (e) { reportError(e); }

  if (!channel || !message) {
    return;
  }

  // Send a message to every socket connected with the identified channel
  channel.sockets.forEach((meta, connectedSocket) => {
    if (connectedSocket) {
      try {
        connectedSocket.send(messageData);
      } catch (e) { reportError(e); }
    }
  });
}

/** Broadcast full state to all peers */
function sendGlobalState(message) {
  if (!message.channel) return;

  const channel = CHANNELS[message.channel];

  // Broadcast full state to everyone
  sendMessageToChannel({
    channel: message.channel,
    type: 'global-state',
    data: channel.state,
  });
}

function onPing(message, websocket) {
  sendMessageToPeer({
    channel: message.channel,
    type: 'pong',
  }, websocket);
}

/** A guest is joining a channel */
function onJoin(message, websocket) {
  if (!message.channel || !websocket) return;

  try {
    const channel = CHANNELS[message.channel];

    if (!channel) {
      CHANNELS[message.channel] = {
        // Default state for a new channel
        state: {
          shared: {},
          peers: {},
        },
        sockets: new Map(),
      };
    }

    const socketMeta = { publicId: uuidV4() };
    CHANNELS[message.channel].sockets.set(websocket, socketMeta);

    // Add a new peer to the list of peers.
    // Future messages can modify the data for this peer.
    // The data associated with this peer is shared with all other peers.
    CHANNELS[message.channel].state.peers[socketMeta.publicId] = {};

    // Let client know about the assigned peer ID
    sendMessageToPeer({
      channel: message.channel,
      type: 'self-state',
      data: { peerId: socketMeta.publicId },
    }, websocket);

    sendGlobalState(message, websocket);
  } catch (e) { reportError(e); }
}

/** Remove closed socket from all channels */
function deleteSocket(websocket) {
  Object.entries(CHANNELS).forEach(([channelName, { sockets }]) => {
    if (sockets.has(websocket)) {
      /**
       * Delete socket from channel
       */
      const socketMeta = CHANNELS[channelName].sockets.get(websocket);

      console.log('should delete…', sockets.size,CHANNELS[channelName].state.peers,socketMeta.publicId)
      // Delete socket
      sockets.delete(websocket);
      // Delete peer data associated with socket
      delete CHANNELS[channelName].state.peers[socketMeta.publicId];
      console.log('should delete2…', CHANNELS[channelName].state.peers)

      /**
       * If there are no more peers in the channel, delete it
       */
      if (Object.keys(CHANNELS[channelName].state).length === 0) {
        delete CHANNELS[channelName];
        return;
      }

      /**
       * Update everyone's state
       */
      sendGlobalState({
        channel: channelName,
      });
    }
  });
}

/** Handle a closed socket */
function onClose(websocket) {
  try {
    if (websocket) deleteSocket(websocket);
  } catch (e) { reportError(e); }
}

/** Broadcast peer state to everyone */
function onSetState(message, websocket) {
  if (!message.channel || !websocket) return;

  const socketMeta = CHANNELS[message.channel].sockets.get(websocket);
  // Update peer state in-place by shallow-merging new state
  Object.assign(CHANNELS[message.channel].state.peers[socketMeta.publicId], message.data);

  sendGlobalState(message, websocket);
}

/** Broadcast shared state submitted from a peer to everyone */
function onSetSharedState(message, websocket) {
  if (!message.channel || !websocket) return;

  // Update shared state in-place by shallow-merging new state
  Object.assign(CHANNELS[message.channel].state.shared, message.data);

  sendGlobalState(message, websocket);
}

function onMessage(message, websocket) {
  if (!message || !websocket) return;

  try {
    const isSocketRegistered = CHANNELS[message.channel]?.sockets.has(websocket);
    if (!isSocketRegistered) {
      onJoin(message, websocket);
    }

    switch (message.type) {
      // Respond to ping with a pong to keep the connection alive
      // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#pings_and_pongs_the_heartbeat_of_websockets
      case 'ping':
        onPing(message, websocket);
        break;

      // Pass along arbitrary data specific to this peer with every peer
      case 'peer-state':
        onSetState(message, websocket);
        break;

      // Pass along arbitrary data to be shared with every peer
      case 'shared-state':
        onSetSharedState(message, websocket);
        break;

      // Pass along any arbitrary data
      default:
        sendMessageToChannel(message);
        break;
    }
  } catch (e) { reportError(e); }
}

export function onConnection(websocket) {
  websocket.on('message', (message) => onMessage(JSON.parse(message), websocket));
  websocket.on('close', () => onClose(websocket));
}
