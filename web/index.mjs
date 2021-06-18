// Importing modules from the Skypack CDN allows us to avoid using build tools.
// Note that for any serious app, you'll be better off using a build tool such as Webpack. 
import { h, render } from 'https://cdn.skypack.dev/preact?min';
import { useState } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import { v4 as generateId } from 'https://cdn.skypack.dev/uuid?min';
import Lobby from './views/Lobby.mjs';
import Play from './views/Play.mjs';
import Results from './views/Results.mjs';
import useInitWebSocketHandlers from './utils/useInitWebSocketHandlers.mjs';

// HTM stands for Hyperscript Tagged Markup.
// It's a JSX-like syntax in plain JavaScript and can be used without transpiler.
const html = htm.bind(h);

// Get the host name from the URL. The `replace` function is used to
// turn http:// into ws:// (in development) and to
// turn https:// into wss:// (in production).
const host = window.location.origin.replace(/^http/, 'ws');

// "/ws" must match with the path defined in server/index.js where "handleUpgrade" is run
const urlWS = `${host}/ws`;

// Now that you have the WebSocket URL, initialize a WebSocket and connect to the server.
const ws = new WebSocket(urlWS);

// A channel within your WebSocket refers to a group of people that are "in the same room",
// playing the same game, allowing them to communicate with each other. If at some point you
// want to run multiple games in parallel, use the same WebSocket and different channel names.
// The code in ws.mjs is pretty arbitrary though and you can come up with many other concepts!
const channelName = 'geo';
const defaultName = generateId().substring(0, 6);
// const mapsApiKey = '<insert-api-key>';
const mapsApiKey = 'AIzaSyCcKZh8dp2eKlRpH1oDQ7RYHW7TOzebpe0';

function App() {
  const [currentView, setCurrentView] = useState('lobby');
  const [globalState, setGlobalState] = useState({});
  const [selfState, setSelfState] = useState({});

  useInitWebSocketHandlers({
    channel: channelName,
    setGlobalState,
    setSelfState,
    defaultName,
    ws,
  });

  console.log('Global State:', globalState);
  console.log('Self State:', selfState);

  const views = {
    lobby: html`<${Lobby} defaultName=${defaultName} setCurrentView=${setCurrentView} />`,
    play: html`<${Play} setCurrentView=${setCurrentView} />`,
    results: html`<${Results} setCurrentView=${setCurrentView} />`,
  };

  return html`
    <script defer src="https://maps.googleapis.com/maps/api/js?v=beta&key=${mapsApiKey}&libraries=geometry&v=weekly"></script>
    ${views[currentView]}
  `;
}

render(html`<${App} />`, document.getElementById('root'));
