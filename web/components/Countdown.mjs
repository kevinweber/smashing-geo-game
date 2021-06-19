import { h } from 'https://cdn.skypack.dev/preact?min';
import { useEffect, useState } from 'https://cdn.skypack.dev/preact/hooks?min';
import htm from 'https://cdn.skypack.dev/htm?min';

const html = htm.bind(h);

/** A very simple countdown component */
export default function Countdown({
  endTime,
  onEndTime,
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
    onEndTime();
    return html`<div>00:00</div>`;
  }

  return html`<div>${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}</div>`;
}