import sendToServer from './sendToServer.mjs';

function getEndTime() {
  // const durationMs = 2 * 60 * 1000; // min * s * ms
  const durationMs = 5 * 1000; // min * s * ms
  return Math.floor((Date.now() + durationMs));
}

function getRandomInRange(from, to, fixed) {
  return Number((Math.random() * (to - from) + from).toFixed(fixed));
}

function findLocation(onLocationFoundCallback) {
  const sv = new window.google.maps.StreetViewService();

  function findRandomLocation(callback) {
    const lat = getRandomInRange(-90, 90, 3);
    const lng = getRandomInRange(-180, 180, 3);

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
  channel, ws,
}) {
  function setLocation(latLng) {
    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        view: 'play',
        endTime: getEndTime(),
        startLatLng: latLng,
      },
    }, ws);
  }

  findLocation(setLocation);
}
