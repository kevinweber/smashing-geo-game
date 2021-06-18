import { h } from 'https://cdn.skypack.dev/preact?min';
import { useEffect, useState, useRef } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import sendToServer from '../utils/sendToServer.mjs';
import mapStyles from '../utils/mapStyles.mjs';

const html = htm.bind(h);

function useInitMap({
  isMapInitialized, startLatLng, refMapSelect, refMapStreetView,
}) {
  // withGoogle().then(() => {
    // https://developers.google.com/maps/documentation/javascript/reference/street-view#StreetViewPanoramaOptions
  new window.google.maps.StreetViewPanorama(
      refMapStreetView.current,
      {
        position: startLatLng,
        addressControl: false,
        clickToGo: true,
        fullscreenControl: false,
        linksControl: false,
        panControl: false,
        showRoadLabels: false,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
      },
    );

    // https://developers.google.com/maps/documentation/javascript/reference/map?hl=en_US#MapOptions
    new window.google.maps.Map(
      refMapSelect.current,
      {
        center: { lat: 49.3072708, lng: 8.6536618 },
        zoom: 2,
        minZoom: 2,
        clickableIcons: false,
        disableDefaultUI: true,
        zoomControl: true,
        // Style wizard: https://mapstyle.withgoogle.com/
        styles: mapStyles,
      },
    );

    // const marker = new window.google.maps.Marker({
    //   map,
    //   title: 'Selected location',
    //   animation: window.google.maps.Animation.DROP,
    //   draggable: true,
    // });

    // const selfState = getSelfState(globalState);
    // // Reset previous guess during map initialization
    // // TODO: Use timestamp instead so that this sendToServer isn't necessary
    // if (selfState?.guessLatLng) {
    //   sendToServer({
    //     type: 'peer-state',
    //     channel,
    //     data: {
    //       guessLatLng: null,
    //     },
    //   }, ws);
    // }

    // map.addListener('click', (mapsMouseEvent) => {
    //   marker.setPosition(mapsMouseEvent.latLng);
    //   sendToServer({
    //     type: 'peer-state',
    //     channel,
    //     data: {
    //       guessLatLng: mapsMouseEvent.latLng,
    //     },
    //   }, ws);
    // });
  // });
}

function Countdown({ 
  ws,
  channel,
  endTime,
}) {
  const [remainingMs, setRemainingMs] = useState(endTime - Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingMs(endTime - Date.now());
    }, 200);
    return () => clearInterval(intervalId);
  }, [endTime]);

  const minutes = Math.floor(remainingMs / 60000).toString(); // 60000 = 1000 (ms) * 60 (s)
  const seconds = ((remainingMs % 60000) / 1000).toFixed(0);

  if (remainingMs <= 0) {
    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        view: 'results',
      },
    }, ws);

    return html`<div>00:00</div>`;
  }

  return html`<div>${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}</div>`;
}

export default function Play({
  ws,
  channel,
  globalState,
  isHost,
}) {

  const isMapInitialized = useRef();
  const refMapSelect = useRef();
  const refMapStreetView = useRef();
  // const [isViewToggled, setIsViewToggled] = useState(false);
  // const { startLatLng, endTime } = globalState.websocket.shared;
  // TODO:
  const startLatLng = new window.google.maps.LatLng(-34, 151);
  const endTime = Math.floor((Date.now() + 3 * 1000));

  useEffect(() => {
    if (isMapInitialized.current || !refMapSelect.current || !refMapStreetView.current) return;
    isMapInitialized.current = true;

    useInitMap({
      // globalState,
      startLatLng,
      refMapSelect,
      refMapStreetView,
      // ws,
      // channel,
    });
  }, [startLatLng])

  return html`
    <div class="full-screen flex-column">
      <div class="flex-stretch flex-row">
        <div ref=${refMapStreetView} class="map-streetview"></div>
        <div ref=${refMapSelect} class="map-select"></div>
      </div>
      <section>
        <${Countdown} ws=${ws} channel=${channel} endTime=${endTime} />
      </section>
    </div>
    `;
}
