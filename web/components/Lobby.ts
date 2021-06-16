import { h } from 'preact';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  useRef,
} from 'preact/hooks';
import htm from 'htm';
import { debounce } from 'lodash';
import { GlobalState } from '../utils/types';
import sendToServer from '../utils/sendToServer';
import { startGame } from '../utils/play';
import Emoji from './Emoji';

const html = htm.bind(h);

export default function Lobby({
  mapsApiKeyState: [mapsApiKey, setMapsApiKey],
  channel,
  globalState,
  setAlertState,
  isHost,
  defaultName,
  ws,
}: {
    // eslint-disable-next-line no-unused-vars
    mapsApiKeyState: [string, (apiKey: string) => string];
    channel?: string;
    globalState: GlobalState;
    setAlertState: () => boolean;
    isHost: boolean;
    defaultName: string;
    ws: WebSocket;
   }) {
  function onInputName(event) {
    sendToServer({
      type: 'peer-state',
      channel,
      data: {
        name: event.target.value || defaultName,
      },
    }, ws);
  }

  function onInputMapsApiKey(event) {
    setMapsApiKey(event.target.value);
  }

  const debouncedInputName = useRef();
  const debouncedInputMapsApiKey = useRef();
  if (!debouncedInputName.current) {
    debouncedInputName.current = debounce(onInputName, 1500);
  }

  if (!debouncedInputMapsApiKey.current) {
    debouncedInputMapsApiKey.current = debounce(onInputMapsApiKey, 1500);
  }

  function onSubmit(event) {
    event.preventDefault();
    return false;
  }

  function onClickStart() {
    startGame({
      channel, mapsApiKey, ws, setAlertState,
    });
  }

  const inputName = html`
      <label>
        Your Name:
        <input type="text" maxlength="30" placeholder="${defaultName}" onInput="${debouncedInputName.current}" />
      </label>`;

  const inputMapsApiKey = html`
      <label>
        Google Maps JavaScript API Key:
        <input type="text" maxlength="50" placeholder="${mapsApiKey}" onInput="${debouncedInputMapsApiKey.current}" />
      </label>`;

  const hostFeatures = isHost ? html`
      <div class="host-features">
        <p>Hosting zone:</p>
        ${inputMapsApiKey}
      </div>` : null;

  const guestFeatures = html`
      <div class="guest-features">
        ${inputName}
      </div>`;

  const readyButton = html`<button class="btn" onClick=${onClickStart}>Start game now</button>`;
  const keyMissingButton = html`<button class="btn" disabled>Set API key to start the game</button>`;
  const waitingForHostButton = html`<button class="btn" disabled>Waiting for host to start the game…</button>`;
  let button = waitingForHostButton;
  if (isHost && mapsApiKey) {
    button = readyButton;
  } else if (isHost) {
    button = keyMissingButton;
  }

  return html`
      <section>
        <form onSubmit="${onSubmit}">
          ${hostFeatures}
          ${guestFeatures}
        </form>
      </section>
  
      <section class="guest-list">
        <p>A total of ${globalState.websocket.peersCount} amazing humans are ready to play:</p>
        <ul>
    ${Object.entries(globalState.websocket.peers).map(
    ([publicId, { emoji, name, role }]) => {
      // A peer might not have any data in global state yet (such as a name),
      // at the time when the pages tries to render the first time
      if (!name) return null;

      const suffix = globalState.websocketSelf.peerId === publicId ? html` <span class="small">(you)</span>` : null;
      const roleSuffix = role ? html` <span class="small">(${role})</span>` : null;

      return html`<li><${Emoji} emoji=${emoji} /> ${name}${roleSuffix}${suffix}</li>`;
    },
  )}
        </ul>
      </section>
  
      <section class="launch-section">
        ${button}
      </section>
    `;
}
