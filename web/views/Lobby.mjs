import { h } from 'https://cdn.skypack.dev/preact?min';
import { useState } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
// import { h } from 'preact';
// import {
//   useRef,
// } from 'preact/hooks';
// import htm from 'htm';
// import { debounce } from 'lodash';
// import { GlobalState } from '../utils/types';
// import sendToServer from '../utils/sendToServer';
// import { startGame } from '../utils/play';
// import Emoji from './Emoji';

const html = htm.bind(h);

export default function Lobby({
  // mapsApiKeyState: [mapsApiKey, setMapsApiKey],
  // channel,
  // globalState,
  // setAlertState,
  // isHost,
  setCurrentView,
  defaultName,
  // ws,
}) {
  const mapsApiKey = 'todo';
  const peers = [{name:'a'}, {name:'b'}];

  function onInputName(event) {
    console.log('name')
    // sendToServer({
    //   type: 'peer-state',
    //   channel,
    //   data: {
    //     name: event.target.value || defaultName,
    //   },
    // }, ws);
  }

  function onClickStart() {
    console.log('start')
    // startGame({
    //   channel, mapsApiKey, ws, setAlertState,
    // });
    setCurrentView('play');
  }

  const inputName = html`
      <label>
        Your Name:
        <input type="text" maxlength="30" placeholder="${defaultName}" onInput="${onInputName}" />
      </label>`;

  const button = html`<button class="btn" onClick=${onClickStart}>Start game now</button>`;
  
  return html`
    <section>
      ${inputName}
    </section>
    <section>
      <p>These amazing humans are ready to play:</p>
      <ul>
        ${peers.map((peer) => {
          return html`<li>${peer.name}</li>`
        })}
      </ul>
    </section>
    <section>
      ${button}
    </section>
  `;
  // return html`
  //     <section class="guest-list">
  //       <p>A total of ${globalState.websocket.peersCount} amazing humans are ready to play:</p>
  //       <ul>
  //   ${Object.entries(globalState.websocket.peers).map(
  //   ([publicId, { emoji, name, role }]) => {
  //     // A peer might not have any data in global state yet (such as a name),
  //     // at the time when the pages tries to render the first time
  //     if (!name) return null;

  //     const suffix = globalState.websocketSelf.peerId === publicId ? html` <span class="small">(you)</span>` : null;
  //     const roleSuffix = role ? html` <span class="small">(${role})</span>` : null;

  //     return html`<li><${Emoji} emoji=${emoji} /> ${name}${roleSuffix}${suffix}</li>`;
  //   },
  // )}
  //       </ul>
  //     </section>
  //   `;
}
