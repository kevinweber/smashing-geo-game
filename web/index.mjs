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
// The default name for YOU that's shared with everyone until you change it
const defaultName = generateId().substring(0, 6);

function App() {
  const [globalState, setGlobalState] = useState({ peers: {}, shared: {} });
  const [selfState, setSelfState] = useState({});

  const sharedProps = {
    defaultName: defaultName,
    channel: channelName,
    globalState,
    setGlobalState,
    selfState,
    setSelfState,
    ws,
  };

  useInitWebSocketHandlers(sharedProps);

  const views = {
    lobby: html`<${Lobby} ...${sharedProps} />`,
    play: html`<${Play} ...${sharedProps} />`,
    results: html`<${Results} ...${sharedProps} />`,
  };

  const currentView = views[globalState.shared.view || 'lobby'];

  return currentView;
}

// Initialize app only once Maps API is loaded so that using "window.google" is safe.
// There are ways to load the app before the API is ready but they are less straightforward.
window.initApp = () => {
  render(html`<${App} />`, document.getElementById('root'));
}