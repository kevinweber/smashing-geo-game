// import sendToServer from './sendToServer';
// import { LatLng } from './types';
// import withGoogle from './withGoogle';

function getEndTime() {
  const durationMs = 2 * 60 * 1000; // min * s * ms
  return Math.floor((Date.now() + durationMs));
}

export function findLocation(onLocationFoundCallback) {
  const sv = new window.google.maps.StreetViewService();

  function findRandomLocation(callback) {
    const lat = (Math.random() * 90) - 90;
    const lng = (Math.random() * 180) - 180;

    // Try to find a panorama within xxxxx meters
    sv.getPanorama({
      location: new window.google.maps.LatLng(lat, lng),
      radius: 100000, // in meters
      source: window.google.maps.StreetViewSource.OUTDOOR,
      preference: window.google.maps.StreetViewPreference.NEAREST,
    }, callback).catch((err) => {
      if (err.code === window.google.maps.StreetViewStatus.ZERO_RESULTS) {
        // Do nothing. It's expected that we don't find a match all the time.
        return;
      }
      console.error(err);
    });
  }

  const onLocationFound = function onLocationFoundR(data, status) {
    // Nothing found? Try again
    if (status !== window.google.maps.StreetViewStatus.OK) {
      findRandomLocation(onLocationFoundR);
      return;
    }
    onLocationFoundCallback(data.location.latLng);
  };

  findRandomLocation(onLocationFound);
}

export function startGame({
  channel, mapsApiKey, ws, setAlertState,
}) {
  sendToServer({
    type: 'shared-state',
    channel,
    data: {
      mapsApiKey,
      view: 'loading',
    },
  }, ws);

  function setLocation(latLng) {
    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        mapsApiKey,
        view: 'play',
        endTime: getEndTime(),
        startLatLng: latLng,
      },
    }, ws);
  }

  withGoogle()
    .then(() => {
      findLocation(setLocation);
    })
    .catch((err) => {
      // If window.Google can't be loaded, return to lobby and show the error
      console.error(err);
      setAlertState(err);
      sendToServer({
        type: 'shared-state',
        channel,
        data: {
          mapsApiKey,
          view: 'lobby',
        },
      }, ws);
    });
}
