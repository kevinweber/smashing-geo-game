import { useRef } from 'https://cdn.skypack.dev/preact/hooks?min';
import sendToServer from './sendToServer.mjs';

export default function useInitWebSocketHandlers({
  channel,
  setGlobalState,
  setSelfState,
  defaultName,
  ws,
}) {
  const isInitialized = useRef();
  const pingInterval = useRef();

  if (isInitialized.current) return;
  isInitialized.current = true;

  // This function is called once the WebSocket connection ends, e.g. when the server restarts
  ws.onclose = () => {
    console.log('WebSocket is closed.');
    clearInterval(pingInterval.current);
  };
  
  // This function is called once the WebSocket connection is established
  ws.onopen = () => {
    console.log('Welcome! WebSocket is open.');

    sendToServer({
      type: 'peer-state',
      channel,
      data: {
        name: defaultName,
      },
    }, ws);

    // Ping WS every 10s to let it know you're still interested in being connected
    pingInterval.current = setInterval(() => {
      sendToServer({
        type: 'ping',
        channel,
      }, ws);
    }, 10000);

    ws.onmessage = (messageFromWebSocket) => {
      const message = JSON.parse(messageFromWebSocket.data);

      console.log('Message', message);

      switch (message.type) {
        // The server acknowledged your ping. Great! This ensures your connection stays alive.
        case 'pong':
          return;

        // The state for every peer has changed
        case 'global-state':
          setGlobalState(message.data);
          break;

        // The state for just yourself has changed
        case 'self-state':
          setSelfState(message.data);
          break;

        default:
          break;
      }
    };
  };
}