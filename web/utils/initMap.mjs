import mapStyles from '../utils/mapStyles.mjs';

export default function useInitMap({
    startLatLng,
    refMapSelect,
    refMapStreetView,
    onSetMarker,
  }) {
    // This is the StreetView frame where users get dropped at the start of a round to explore the area
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
  
    // This is the map where users need to set a marker to guess their location.
    // API: https://developers.google.com/maps/documentation/javascript/reference/map?hl=en_US#MapOptions
    const guessMap = new window.google.maps.Map(
      refMapSelect.current,
      {
        center: { lat: 49.3072708, lng: 8.6536618 },
        zoom: 2,
        minZoom: 2,
        clickableIcons: false,
        disableDefaultUI: true,
        zoomControl: true,
        styles: mapStyles,
      },
    );
  
    const marker = new window.google.maps.Marker({
      map: guessMap,
      title: 'Selected location',
      animation: window.google.maps.Animation.DROP,
    });

    guessMap.addListener('click', (mapsMouseEvent) => {
      marker.setPosition(mapsMouseEvent.latLng);
      onSetMarker(mapsMouseEvent.latLng);
    });
  }