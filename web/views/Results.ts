import { h } from 'preact';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  useState, useEffect, useRef, useMemo,
} from 'preact/hooks';
import htm from 'htm';
import {
  GlobalState, LatLng, PeerState, RoundRecord,
} from '../utils/types';
import { startGame } from '../utils/play';
import sendToServer from '../utils/sendToServer';
import withGoogle from '../utils/withGoogle';
import Emoji from './Emoji';
import { awards, pickRandomHappyText } from '../utils/emojiList';
import mapStyles from '../utils/mapStyles';

const html = htm.bind(h);

const placements = {
  first: {
    mark: '1',
    emoji: awards.medalFirst,
  },
  second: {
    mark: '2',
    emoji: awards.medalSecond,
  },
  third: {
    mark: '3',
    emoji: awards.medalThird,
  },
  last: {
    mark: 'Z',
    emoji: awards.star,
  },
};

type ResultEntry = [string, PeerState & { distance: number }]

function getPeerId({ name, emoji }: {name: PeerState['name'], emoji: PeerState['emoji']}) {
  return `${name}:${emoji}`;
}

function getDistanceInKm({ from, to }) {
  const number = (
    google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(from),
      new google.maps.LatLng(to),
    ) * 0.001
  );
  // Only show decimals when distance is below 100 km
  return Number(number.toFixed(number < 100 ? 2 : 0));
}

export default function Results({
  ws,
  channel,
  globalState,
  isHost,
  mapsApiKey,
  setAlertState,
}: {
    channel?: string;
    globalState: GlobalState;
    isHost: boolean;
    ws: WebSocket;
    mapsApiKey: string;
    setAlertState: () => boolean;
   }) {
  const refMapSelect = useRef<HTMLElement>();
  const [sortedResults, setResults] = useState<ResultEntry[]>([]);
  const [playAgainCount, setPlayAgainCount] = useState(0);
  const [hasRequestedToPlayAgain, setHasRequestedToPlayAgain] = useState(false);
  const mapRef = useRef<google.maps.Map>();
  const randomHappyText = useMemo(pickRandomHappyText, []);
  const isRoundRecorded = useRef();

  useEffect(() => {
    withGoogle().then(() => {
      // Once map is initialized, don't update its centering to avoid
      // unexpected "jumps" of the map for a user who's using the map
      if (mapRef.current) return;

      mapRef.current = new google.maps.Map(
        refMapSelect.current,
        {
          center: globalState.websocket.shared.startLatLng,
          zoom: 5,
          minZoom: 2,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          styles: mapStyles,
        },
      );

      // Set the marker for `startLatLng`
      (() => new google.maps.Marker({
        map: mapRef.current,
        position: globalState.websocket.shared.startLatLng,
        title: 'This is what you should have guessed',
        animation: google.maps.Animation.DROP,
      }))();
    });
  }, [globalState.websocket.shared.startLatLng]);

  useEffect(() => {
    withGoogle().then(() => {
      let localPlayAgainCount = 0;
      const resultsList = Object.entries(globalState.websocket.peers)
        .map(([publicId, { guessLatLng, ...restProps }]) => {
          // Only increase play again count if the timestamp was updated after the last round ended
          if (restProps.playAgain > globalState.websocket.shared.endTime) {
            localPlayAgainCount += 1;
          }

          const distance = getDistanceInKm({
            from: guessLatLng,
            to: globalState.websocket.shared.startLatLng,
          });

          return [publicId, {
            ...restProps,
            guessLatLng,
            distance,
          }] as ResultEntry;
        })
        // A peer might not have any data in global state (such as a name)
        // at the time when the pages tries to render the first time.
        // Ignore those results.
        .filter(([, { name }]) => !!name)
        // Sort from highest to lowest distance. Treat NaN as lowest.
        .sort(([, a], [, b]) => {
          if (Number.isNaN(a.distance)) return 1;
          if (Number.isNaN(b.distance)) return -1;
          return a.distance - b.distance;
        });

      // Move last result to fourth position to highlight it in the UX alongside the top results
      if (resultsList.length > 4) {
        resultsList.splice(3, 0, resultsList.splice(resultsList.length - 1, 1)[0]);
      }

      setPlayAgainCount(localPlayAgainCount);
      setResults(resultsList);
    });
  }, [
    globalState.websocket.peers,
    globalState.websocket.shared.startLatLng,
    globalState.websocket.shared.endTime,
  ]);

  // Push round record with current scores.
  // Those persist across rounds until the game is ended by the host.
  // Only push a record once.
  useEffect(() => {
    if (isRoundRecorded.current || !isHost || !sortedResults.length) return;
    isRoundRecorded.current = true;

    const rounds = globalState.websocket.shared.rounds || {};
    const roundId = globalState.websocket.shared.endTime;
    if (!rounds[roundId]) rounds[roundId] = {};

    sortedResults.forEach(([, { emoji, name, distance }], index) => {
      if (!distance) return;
      // TODO: Calculate scores based on distance
      const score = {
        0: 4,
        1: 3,
        2: 2,
        3: 1,
      };
      rounds[roundId][getPeerId({ name, emoji })] = score[index] || 0;
    });

    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        rounds,
      },
    }, ws);
  }, [
    isHost,
    globalState.websocket.shared.rounds,
    channel,
    ws,
    sortedResults,
    globalState.websocket.shared.endTime,
  ]);

  function onClickNext() {
    startGame({
      channel, mapsApiKey, ws, setAlertState,
    });
  }

  function onClickEnd() {
    sendToServer({
      type: 'shared-state',
      channel,
      data: {
        view: 'lobby',
        // Reset round records
        rounds: null,
      },
    }, ws);
  }

  const nextButton = html`<button class="btn" onClick=${onClickNext}>Next round</button>`;
  const endButton = html`<button class="btn" onClick=${onClickEnd}>End game</button>`;

  function placePeerMarker({
    isSelf, position, name, mark,
  }:
    { isSelf: boolean; position?: LatLng; name: string; mark: string }) {
    if (!position) return;

    const iconType = isSelf ? 'b' : 'a'; // b == red vs. a == green;
    const strokeColor = isSelf ? '#ee473e' : '#69b32e'; // red vs. green
    const iconText = isSelf ? 'you' : mark;
    const icon = `https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-${iconType}.png&text=${iconText}&psize=11&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1`;

    // Set marker
    (() => new google.maps.Marker({
      map: mapRef.current,
      position,
      title: name,
      icon,
    }))();

    // Draw line to startLatLng
    (() => new google.maps.Polyline({
      strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      map: mapRef.current,
      path: [position, globalState.websocket.shared.startLatLng],
    }))();
  }

  const placeResult = (
    { withPlacement }: { withPlacement: boolean },
    [publicId, {
      emoji, name, distance, guessLatLng,
    }]: ResultEntry,
    index: number,
  ) => {
    const isSelf = globalState.websocketSelf.peerId === publicId;
    let placementEmoji: string | undefined;

    if (withPlacement) {
      switch (index) {
        case 0:
          placementEmoji = placements.first.emoji;
          placePeerMarker({
            isSelf, position: guessLatLng, name, mark: placements.first.mark,
          });
          break;
        case 1:
          placementEmoji = placements.second.emoji;
          placePeerMarker({
            isSelf, position: guessLatLng, name, mark: placements.second.mark,
          });
          break;
        case 2:
          placementEmoji = placements.third.emoji;
          placePeerMarker({
            isSelf, position: guessLatLng, name, mark: placements.third.mark,
          });
          break;
        case 3:
          placementEmoji = placements.last.emoji;
          placePeerMarker({
            isSelf, position: guessLatLng, name, mark: placements.last.mark,
          });
          break;
        default:
          break;
      }
    } else if (isSelf) {
      placePeerMarker({
        isSelf, position: guessLatLng, name, mark: '',
      });
    }

    const suffix = isSelf ? html` <span class="small">(you)</span>` : null;
    const result = Number.isNaN(distance) ? '--' : `${distance} km`;
    const peerId = getPeerId({ name, emoji });
    const { rounds } = globalState.websocket.shared;
    const totalScore = rounds ? Object.values(globalState.websocket.shared.rounds).reduce(
      (acc, scores) => {
        const score = scores[peerId] || 0;
        return score + acc;
      }, 0,
    ) : 0;

    return html`<div class="table-row">
        <div class="table-cell">
          <${Emoji} emoji=${placementEmoji} />
        </div>
        <div class="table-cell">
          <${Emoji} emoji=${emoji} /> ${name}${suffix}
        </div>
        <div class="table-cell">
          ${result}
        </div>
        <div class="table-cell">
          ${totalScore}
        </div>
    </div>`;
  };

  function onRequestPlayAgain() {
    sendToServer({
      type: 'peer-state',
      channel,
      data: {
        playAgain: Date.now(),
      },
    }, ws);

    setHasRequestedToPlayAgain(true);
  }

  const requestPlayAgainButton = html`<button class="btn" onClick=${onRequestPlayAgain}>Play again? Notify host</button>`;
  const waitingForHostButton = html`<button class="btn" disabled>Great! Waiting for host…</button>`;
  const guestButton = hasRequestedToPlayAgain ? waitingForHostButton : requestPlayAgainButton;

  return html`
      <section class="full-screen flex-row">
        <div class="scrollable results">
          <div class="scrollable-inner">
            ${isHost ? html`
            <section class="relaunch-section">
              ${nextButton}
              ${endButton}
            </section>
            <section class="poll-section">
              ${playAgainCount} guests want to play again
            </section>
            ` : null}
            ${sortedResults.length ? html`
            <div class="table results-list">
              <div class="table-header-group results-list-header">
                <div class="table-cell"></div>
                <div class="table-cell"></div>
                <div class="table-cell">Last guess</div>
                <div class="table-cell">Total points</div>
              </div>
              <div class="table-row-group results-list-top">
                ${sortedResults.slice(0, 4).map((entry, index) => placeResult({ withPlacement: true }, entry, index))}
              </div>
              <div class="table-row-group results-list-bottom">
                ${sortedResults.slice(4).map((entry, index) => placeResult({ withPlacement: false }, entry, index))}
              </div>
            </div>` : null}
            ${isHost ? null : html`<section class="happy-text"><p>Well done!! ${randomHappyText}</p></section>`}
            ${isHost ? null : html`<section class="waiting-for-host">${guestButton}</section>`}
          </div>
        </div>
        <div ref=${refMapSelect} class="map-result"></div>
      </section>
    `;
}
