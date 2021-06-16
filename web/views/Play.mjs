import { h } from 'https://cdn.skypack.dev/preact?min';
import { useState, useRef, useCallback } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';
// import { GlobalState, LatLng } from '../utils/types';
// import sendToServer from '../utils/sendToServer';
// import withGoogle from '../utils/withGoogle';
// import mapStyles from '../utils/mapStyles';
// import { getSelfState } from '../utils/globalState';

const html = htm.bind(h);

function useInitMap({
  globalState, startLatLng, refMapSelect, refMapStreetView, ws, channel,
}) {
  const isInitialized = useRef();
  if (isInitialized.current) return;
  isInitialized.current = true;

  withGoogle().then(() => {
    // https://developers.google.com/maps/documentation/javascript/reference/street-view#StreetViewPanoramaOptions
    (() => new google.maps.StreetViewPanorama(
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
          position: google.maps.ControlPosition.RIGHT_TOP,
        },
      },
    ))();

    // https://developers.google.com/maps/documentation/javascript/reference/map?hl=en_US#MapOptions
    const map = new google.maps.Map(
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

    const marker = new google.maps.Marker({
      map,
      title: 'Selected location',
      animation: google.maps.Animation.DROP,
      draggable: true,
    });

    const selfState = getSelfState(globalState);
    // Reset previous guess during map initialization
    // TODO: Use timestamp instead so that this sendToServer isn't necessary
    if (selfState?.guessLatLng) {
      sendToServer({
        type: 'peer-state',
        channel,
        data: {
          guessLatLng: null,
        },
      }, ws);
    }

    map.addListener('click', (mapsMouseEvent) => {
      marker.setPosition(mapsMouseEvent.latLng);
      sendToServer({
        type: 'peer-state',
        channel,
        data: {
          guessLatLng: mapsMouseEvent.latLng,
        },
      }, ws);
    });
  });
}

function Countdown({ ws, channel, endTime }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(endTime - Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingMs(endTime - Date.now());
    }, 200);
    return () => clearInterval(intervalId);
  }, [endTime]);

  const minutes = Math.floor(remainingMs / 60000).toString(); // 60000 = 1000 (ms) * 60 (s)
  const seconds = ((remainingMs % 60000) / 1000).toFixed(0);

  const areFinalSeconds = Number(minutes) === 0 && Number(seconds) < 11;
  const countdownClasses = `map-countdown${areFinalSeconds ? ' map-countdown--danger' : ''}`;

  const Wrapped = useCallback(
    ({ children }) => html`<div class=${countdownClasses}><div>${children}</div></div>`,
    [countdownClasses],
  );

  if (remainingMs <= 0) {
    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        view: 'results',
      },
    }, ws);

    return html`<${Wrapped} children="00:00" />`;
  }

  return html`<${Wrapped} children="${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}" />`;
}

export default function Play({
  ws,
  channel,
  globalState,
  isHost,
}) {
  const refMapSelect = useRef();
  const refMapStreetView = useRef();
  // const [isViewToggled, setIsViewToggled] = useState(false);
  // const { startLatLng, endTime } = globalState.websocket.shared;

  // useInitMap({
  //   globalState,
  //   startLatLng,
  //   refMapSelect,
  //   refMapStreetView,
  //   ws,
  //   channel,
  // });

  // TODO: countdown:
  // <${Countdown} channel=${channel} ws=${ws} endTime=${endTime} />
  return html`
    <div class="full-screen flex-column">
      <div class="flex-stretch flex-row">
        <div ref=${refMapStreetView} class="map-streetview"></div>
        <div ref=${refMapSelect} class="map-select"></div>
      </div>
      <section>
        todo countdown
      </section>
    </div>
    `;
}
