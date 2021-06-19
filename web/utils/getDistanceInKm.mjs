/** Calculate distance between two points using Google's Geometry library */
export default function getDistanceInKm({ from, to }) {
  const number = (
    window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(from),
      new window.google.maps.LatLng(to),
    ) * 0.001
  );

  // Show distance with two decimals
  return Number(number.toFixed(2));
}