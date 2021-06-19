import { h } from 'https://cdn.skypack.dev/preact?min';
import { useEffect, useState, useRef } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import { startGame } from '../utils/startGame.mjs';
import getDistanceInKm from '../utils/getDistanceInKm.mjs';
import sendToServer from '../utils/sendToServer.mjs';
import initMapWithResults from '../utils/initMapForResults.mjs';

const html = htm.bind(h);

export default function Results({
  ws,
  channel,
  globalState,
  selfState,
}) {
  const isMapInitialized = useRef();
  const refMapResults = useRef();
  const refMapInstance = useRef();
  const [sortedResults, setResults] = useState([]);
  
  useEffect(() => {
    // Once map is initialized, don't update its centering to avoid
    // unexpected "jumps" of the map after the user moved it map
    if (isMapInitialized.current) return;
    isMapInitialized.current = true;

    initMapWithResults({
      startLatLng: globalState.shared.startLatLng,
      refMapResults,
      refMapInstance,
    });
  }, [globalState.shared.startLatLng]);

  useEffect(() => {
    const resultsList = Object.entries(globalState.peers)
      .map(([publicId, { guessLatLng, ...restProps }]) => {
        const distance = getDistanceInKm({
          from: guessLatLng,
          to: globalState.shared.startLatLng,
        });

        return [publicId, {
          ...restProps,
          guessLatLng,
          distance,
        }];
      })
      // A peer might not have any data in global state (such as a name)
      // at the time when the page tries to render the first time.
      // Filter out those results.
      .filter(([, { name }]) => !!name)
      // Sort from highest to lowest distance. Treat NaN as lowest.
      .sort(([, a], [, b]) => {
        if (Number.isNaN(a.distance)) return 1;
        if (Number.isNaN(b.distance)) return -1;
        return a.distance - b.distance;
      });

    setResults(resultsList);
  }, [
    globalState.peers,
    globalState.shared.startLatLng,
    globalState.shared.endTime,
  ]);

  function onClickNext() {
    startGame({
      channel,
      ws,
    });
  }

  function onClickEnd() {
    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        view: 'lobby',
      },
    }, ws);
  }

  function placePeerMarkerOnMap({
    isSelf, position, name,
  }) {
    if (!position) return;

    const iconType = isSelf ? 'b' : 'a'; // b == red vs. a == green;
    const strokeColor = isSelf ? '#ee473e' : '#69b32e'; // red vs. green
    const iconText = isSelf ? 'you' : name.slice(0, 2);
    const icon = `https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-${iconType}.png&text=${iconText}&psize=11&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1`;

    // Set marker
    new window.google.maps.Marker({
      map: refMapInstance.current,
      position,
      title: name,
      icon,
    });

    // Draw line to startLatLng
    new window.google.maps.Polyline({
      strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      map: refMapInstance.current,
      path: [position, globalState.shared.startLatLng],
    });
  }

  const placeResult = (
    [publicId, { name, guessLatLng, distance }],
    index,
  ) => {
    placePeerMarkerOnMap({
      isSelf: selfState.peerId === publicId,
      position: guessLatLng,
      name,
    });

    const formattedDistance = Number.isNaN(distance) ? '--' : `${distance} km`;
    const placement = `${index + 1})`
    
    return html`<div>${placement} ${name}: ${formattedDistance}</div>`;
  };

  return html`
    <div class="full-screen flex-row">
      <div class="flex-column flex-stretch">
        <section>
          <button class="btn" onClick=${onClickNext}>Next round</button>
          <button class="btn" onClick=${onClickEnd}>End game</button>
        </section>
        <section>
          ${sortedResults.map(placeResult)}
        </section>
      </div>
      <div ref=${refMapResults} class="flex-stretch"></div>
    </div>
  `;
}
