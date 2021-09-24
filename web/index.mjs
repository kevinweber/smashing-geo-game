// Importing modules from the Skypack CDN allows us to avoid using build tools.
// Note that for any serious app, you'll be better off using a build tool such as Webpack. 
import { h, render } from 'https://cdn.skypack.dev/preact?min';
import { useState } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import { v4 as generateId } from 'https://cdn.skypack.dev/uuid?min';
import PageA from './views/PageA.mjs';

// HTM stands for Hyperscript Tagged Markup.
// It's a JSX-like syntax in plain JavaScript and can be used without transpiler.
const html = htm.bind(h);

// Auto-generated default string
const defaultName = generateId().substring(0, 6);

function App() {
  const [clicks, setClicks] = useState(0);

  const demoProps = {
    clicks,
    setClicks,
    defaultName: defaultName,
  }

  return html`<${PageA} ...${demoProps} />`;
}

render(html`<${App} />`, document.getElementById('root'));