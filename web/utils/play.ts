import sendToServer from './sendToServer';
import { LatLng } from './types';
import withGoogle from './withGoogle';

function getEndTime() {
  const durationMs = 2 * 60 * 1000; // min * s * ms
  return Math.floor((Date.now() + durationMs));
}

function findLocation(onLocationFoundCallback) {
  const sv = new google.maps.StreetViewService();

  function findRandomLocation(callback) {
    const lat = (Math.random() * 90) - 90;
    const lng = (Math.random() * 180) - 180;

    // Try to find a panorama within xxxxx meters
    sv.getPanorama({
      location: new google.maps.LatLng(lat, lng),
      radius: 100000, // in meters
      source: google.maps.StreetViewSource.OUTDOOR,
      preference: google.maps.StreetViewPreference.NEAREST,
    }, callback).catch((err) => {
      if (err.code === google.maps.StreetViewStatus.ZERO_RESULTS) {
        // Do nothing. It's expected that we don't find a match all the time.
        return;
      }
      console.error(err);
    });
  }

  const onLocationFound = function onLocationFoundR(data, status) {
    // Nothing found? Try again
    if (status !== google.maps.StreetViewStatus.OK) {
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

  function setLocation(latLng: LatLng) {
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
      // If Google can't be loaded, return to lobby and show the error
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
