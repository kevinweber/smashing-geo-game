import mapStyles from '../utils/mapStyles.mjs';

export default function initMapForResults({
  startLatLng,
  refMapResults,
  refMapInstance,
}) {
  // Create the map instance that will show all the result markers and distances
  refMapInstance.current = new window.google.maps.Map(
    refMapResults.current,
    {
      center: startLatLng,
      zoom: 5,
      minZoom: 2,
      clickableIcons: false,
      disableDefaultUI: true,
      zoomControl: true,
      styles: mapStyles,
    },
  );

  // Set the marker for `startLatLng`
  new window.google.maps.Marker({
    map: refMapInstance.current,
    position: startLatLng,
    title: 'This is the location that you should have guessed',
    animation: window.google.maps.Animation.DROP,
  });
}