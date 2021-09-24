import { h } from 'https://cdn.skypack.dev/preact?min';
import htm from 'https://cdn.skypack.dev/htm?min';

const html = htm.bind(h);

export default function PageA({
  defaultName,
  clicks,
  setClicks,
}) {
  function onInputName(event) {
    console.log(event.target.value || defaultName);
  }

  function onClickStart() {
    setClicks(clicks + 1);
  }

  const inputName = html`
    <label>
      Your Name:
      <input type="text" maxlength="30" placeholder="${defaultName}" onInput="${onInputName}" />
    </label>`;

  const button = html`<button class="btn" onClick=${onClickStart}>Clicks: ${clicks}</button>`;

  return html`
    <section>${inputName}</section>
    <section>${button}</section>
  `;
}
