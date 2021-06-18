// Importing modules from the Skypack CDN allows us to avoid using build tools.
// Note that for any serious app, you'll be better off using a build tool such as Webpack. 
import { h, render } from 'https://cdn.skypack.dev/preact?min';
import { useState } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import { v4 as generateId } from 'https://cdn.skypack.dev/uuid?min';
import Lobby from './views/Lobby.mjs';
import Play from './views/Play.mjs';
import Results from './views/Results.mjs';

// import {
//   WSDataFromServer, BootstrapData, Alert, PeerState,
// } from './utils/types';
// import {
//   useGlobalState, GlobalStateDispatch,
// } from './utils/globalState';
// import { getQueryParams } from './utils/url';
// import sendToServer from './utils/sendToServer';
// import Lobby from './components/Lobby';
// import Play from './components/Play';
// import { pickRandomIcon } from './utils/emojiList';
// import Results from './components/Results';
// import { useInitialBootstrapData } from './utils/bootstrapData';

// HTM stands for Hyperscript Tagged Markup.
// It's a JSX-like syntax in plain JavaScript and can be used without transpiler.
const html = htm.bind(h);

// Get the host name from the URL. The `replace` function is used to
// turn http:// into ws:// (in development) and to
// turn https:// into wss:// (in production).
const host = window.location.origin.replace(/^http/, 'ws');

// "/ws" must match with the path defined in server/index.js where "handleUpgrade" is run
const urlWS = `${host}/ws`;

// Now that we have the WebSocket URL, let's initialize a Websocket and connect to our server.
const ws = new WebSocket(urlWS);

// A channel within your WebSocket refers to a group of people that are "in the same room",
// playing the same game, allowing them to communicate with each other. If at some point you
// want to run multiple games in parallel, use the same WebSocket and different channel names.
// The code in ws.mjs is pretty arbitrary though and you can come up with many other concepts!
const channel = 'geo';

const defaultName = generateId().substring(0, 6);
// const mapsApiKey = '<insert-api-key>';
const mapsApiKey = 'AIzaSyCcKZh8dp2eKlRpH1oDQ7RYHW7TOzebpe0';

// let pingInterval;

// function useInitWebSocketHandlers(
//   {
//     channel, dispatchGlobalState, setAlertState,
//   }:
//   {
//     channel?: string;
//     dispatchGlobalState: GlobalStateDispatch;
//     setAlertState
//   },
// ) {
//   const isInitialized = useRef();
//   if (isInitialized.current) return;
//   isInitialized.current = true;

//   ws.onclose = () => {
//     console.log('WebSocket is closed.');
//     setAlertState({ message: 'Connection closed. Please reload the page.' });
//     clearInterval(pingInterval);
//   };

//   ws.onopen = () => {
//     console.log('Welcome! WebSocket is open.');

//     sendToServer({
//       type: 'join',
//       channel,
//     }, ws);

//     const data: PeerState = {
//       name: defaultName,
//       emoji,
//     };

//     if (isHost) {
//       console.log('Thanks for hosting 😍');
//       data.role = 'host';
//     }

//     sendToServer({
//       type: 'peer-state',
//       channel,
//       data,
//     }, ws);

//     // Ping WS every 10s to let it know we're still interested in being connected
//     pingInterval = setInterval(() => {
//       sendToServer({
//         type: 'ping',
//         channel,
//       }, ws);
//     }, 10000);

//     ws.onmessage = (nativeMessage) => {
//       const message = JSON.parse(nativeMessage.data) as WSDataFromServer;

//       // The server acknowledged our ping. Great!
//       if (message.type === 'pong') return;

//       dispatchGlobalState(message);

//       // If this is the first peer in a channel, only a loading view is shown.
//       // Change it to the lobby. We don't want lobby to be the default because
//       // then users who are joining late will briefly see the lobby instead of
//       // the view currently established for the channel.
//       if (message.type === 'global-state' && !message.data.shared.view) {
//         sendToServer({
//           type: 'shared-state',
//           channel,
//           data: {
//             view: 'lobby',
//           },
//         }, ws);
//       }
//     };
//   };
// }

function App() {
  const [currentView, setCurrentView] = useState('lobby');

//   // Global state: Shared with every connected peer
//   const [globalState, dispatchGlobalState] = useGlobalState();

//   // Local states
//   const alertState = useState<Alert>({});
//   const [{ message: alertMessage }, setAlertState] = alertState;
//   const mapsApiKeyState = useState<string>(defaultMapsApiKey);
//   const [mapsApiKey] = mapsApiKeyState;

//   useInitWebSocketHandlers({
//     channel, dispatchGlobalState, setAlertState,
//   });

//   console.log('Global State:', globalState);

//   const alertBanner = alertMessage ? html`<section class="alert">${alertMessage}</section>` : null;

  const views = {
    lobby: html`<${Lobby} defaultName=${defaultName} setCurrentView=${setCurrentView} />`,
    play: html`<${Play} setCurrentView=${setCurrentView} />`,
    results: html`<${Results} setCurrentView=${setCurrentView} />`,
  };

  return html`
    <script defer src="https://maps.googleapis.com/maps/api/js?v=beta&key=${mapsApiKey}&libraries=geometry&v=weekly"></script>
    ${views[currentView]}
  `;
  // return html`
  //   <${Scripts} mapsApiKey=${globalState.websocket.shared.mapsApiKey} /> 
  //   ${alertBanner}
  //   ${views[globalState.websocket.shared.view] || views.loading} 
  // `;
}

render(html`<${App} />`, document.getElementById('root'));
