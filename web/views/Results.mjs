import { h } from 'https://cdn.skypack.dev/preact?min';
import { useEffect, useState, useRef } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import mapStyles from '../utils/mapStyles.mjs';
import sendToServer from '../utils/sendToServer.mjs';
// import { h } from 'preact';
// // eslint-disable-next-line import/no-extraneous-dependencies
// import {
//   useState, useEffect, useRef, useMemo,
// } from 'preact/hooks';
// import htm from 'htm';
// import {
//   GlobalState, LatLng, PeerState, RoundRecord,
// } from '../utils/types';
// import { startGame } from '../utils/play';
// import sendToServer from '../utils/sendToServer';
// import withGoogle from '../utils/withGoogle';
// import mapStyles from '../utils/mapStyles';

const html = htm.bind(h);

function getDistanceInKm({ from, to }) {
  const number = (
    window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(from),
      new window.google.maps.LatLng(to),
    ) * 0.001
  );
  // Only show decimals when distance is below 100 km
  return Number(number.toFixed(number < 100 ? 2 : 0));
}

export default function Results({
  ws,
  channel,
  // globalState,
}) {
  // TODO:
  const globalState = {
    websocket: {
      shared: {
        startLatLng: new window.google.maps.LatLng(-34, 151),
      }
    }
  }

  const refMapSelect = useRef();
  const [sortedResults, setResults] = useState([]);
  const mapRef = useRef();
  
  useEffect(() => {
    // Once map is initialized, don't update its centering to avoid
    // unexpected "jumps" of the map for a user who's using the map
    if (mapRef.current) return;

    mapRef.current = new window.google.maps.Map(
      refMapSelect.current,
      {
        center: globalState.websocket.shared.startLatLng,
        zoom: 5,
        minZoom: 2,
        clickableIcons: false,
        disableDefaultUI: true,
        zoomControl: true,
        styles: mapStyles,
      },
    );

    // Set the marker for `startLatLng`
    (() => new window.google.maps.Marker({
      map: mapRef.current,
      position: globalState.websocket.shared.startLatLng,
      title: 'This is the location that you should have guessed',
      animation: window.google.maps.Animation.DROP,
    }))();
  }, [globalState.websocket.shared.startLatLng]);

  useEffect(() => {
    const resultsList = Object.entries(globalState.websocket.peers)
      .map(([publicId, { guessLatLng, ...restProps }]) => {
        const distance = getDistanceInKm({
          from: guessLatLng,
          to: globalState.websocket.shared.startLatLng,
        });

        return [publicId, {
          ...restProps,
          guessLatLng,
          distance,
        }];
      })
      // A peer might not have any data in global state (such as a name)
      // at the time when the pages tries to render the first time.
      // Ignore those results.
      .filter(([, { name }]) => !!name)
      // Sort from highest to lowest distance. Treat NaN as lowest.
      .sort(([, a], [, b]) => {
        if (Number.isNaN(a.distance)) return 1;
        if (Number.isNaN(b.distance)) return -1;
        return a.distance - b.distance;
      });

    // Move last result to fourth position to highlight it in the UX alongside the top results
    if (resultsList.length > 4) {
      resultsList.splice(3, 0, resultsList.splice(resultsList.length - 1, 1)[0]);
    }

    setResults(resultsList);
  }, [
    globalState.websocket.peers,
    globalState.websocket.shared.startLatLng,
    globalState.websocket.shared.endTime,
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

  const nextButton = html`<button class="btn" onClick=${onClickNext}>Next round</button>`;
  const endButton = html`<button class="btn" onClick=${onClickEnd}>End game</button>`;

  function placePeerMarkerOnMap({
    isSelf, position, name, mark,
  }) {
    if (!position) return;

    const iconType = isSelf ? 'b' : 'a'; // b == red vs. a == green;
    const strokeColor = isSelf ? '#ee473e' : '#69b32e'; // red vs. green
    const iconText = isSelf ? 'you' : mark;
    const icon = `https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-${iconType}.png&text=${iconText}&psize=11&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1`;

    // Set marker
    (() => new window.google.maps.Marker({
      map: mapRef.current,
      position,
      title: name,
      icon,
    }))();

    // Draw line to startLatLng
    (() => new window.google.maps.Polyline({
      strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      map: mapRef.current,
      path: [position, globalState.websocket.shared.startLatLng],
    }))();
  }

  const placeResult = (
    [publicId, { name, guessLatLng }],
  ) => {
    const isSelf = globalState.websocketSelf.peerId === publicId;

    placePeerMarkerOnMap({
      isSelf, position: guessLatLng, name, mark: placements.first.mark,
    });

    const result = Number.isNaN(distance) ? '--' : `${distance} km`;
    
    return html`<div>${name}: ${result}</div>`;
  };

  return html`
    <section class="full-screen flex-row">
      <div class="scrollable results">
        <div class="scrollable-inner">
          <section class="relaunch-section">
            ${nextButton}
            ${endButton}
          </section>
          <section>
            ${sortedResults.map(placeResult)}
          </section>
        </div>
      </div>
      <div ref=${refMapSelect} class="map-result"></div>
    </section>
  `;
}
