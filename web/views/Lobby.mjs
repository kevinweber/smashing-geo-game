import { h } from 'https://cdn.skypack.dev/preact?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import { startGame } from '../utils/startGame.mjs';
import sendToServer from '../utils/sendToServer.mjs';

const html = htm.bind(h);

export default function Lobby({
  channel,
  globalState,
  defaultName,
  ws,
}) {
  const peers = Object.values(globalState.peers);

  function onInputName(event) {
    sendToServer({
      type: 'peer-state',
      channel,
      data: {
        name: event.target.value || defaultName,
      },
    }, ws);
  }

  function onClickStart() {
    startGame({
      channel, ws,
    });
  }

  const inputName = html`
      <label>
        Your Name:
        <input type="text" maxlength="30" placeholder="${defaultName}" onInput="${onInputName}" />
      </label>`;

  const button = html`<button class="btn" onClick=${onClickStart}>Start game now</button>`;
  
  return html`
    <section>${inputName}</section>
    <section>
      <p>These amazing humans are ready to play:</p>
      <ul>${peers.map((peer) => html`<li>${peer.name}</li>`)}</ul>
    </section>
    <section>${button}</section>
  `;
}
