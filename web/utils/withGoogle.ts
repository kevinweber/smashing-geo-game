import poll from './poll';

export default async function withGoogle(): Promise<{ maps: {
  Map: google.maps.Map
} }> {
  return poll(
    () => window.google,
    10000, // Timeout
    100, // Poll interval
    'Google Maps couldn\'t be initialized', // Timeout error
  );
}
