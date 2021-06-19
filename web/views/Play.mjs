import { h } from 'https://cdn.skypack.dev/preact?min';
import { useEffect, useRef } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import sendToServer from '../utils/sendToServer.mjs';
import initMap from '../utils/initMap.mjs';
import Countdown from '../components/Countdown.mjs';

const html = htm.bind(h);

export default function Play({
  ws,
  channel,
  globalState,
}) {
  const isMapInitialized = useRef();
  const refMapSelect = useRef();
  const refMapStreetView = useRef();
  const { startLatLng, endTime } = globalState.shared;

  function onSetMarker(latLng) {
    sendToServer({
      type: 'peer-state',
      channel,
      data: {
        guessLatLng: latLng,
      },
    }, ws);
  }
  
  useEffect(() => {
    if (isMapInitialized.current) return;
    isMapInitialized.current = true;

    initMap({
      startLatLng,
      refMapSelect,
      refMapStreetView,
      onSetMarker,
    });
  }, [startLatLng])

  function onEndTime() {
    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        view: 'results',
      },
    }, ws);
  }

  return html`
    <div class="full-screen flex-column">
      <div class="flex-stretch flex-row">
        <div ref=${refMapStreetView} class="flex-stretch"></div>
        <div ref=${refMapSelect} class="flex-stretch"></div>
      </div>
      <section>
        <${Countdown} endTime=${endTime} onEndTime=${onEndTime} />
      </section>
    </div>
    `;
}
