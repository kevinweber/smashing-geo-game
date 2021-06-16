import { clone as cloneDeep } from 'ramda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useReducer } from 'preact/hooks';
import { WSDataFromServer, GlobalState, PeerState } from './types';

// eslint-disable-next-line no-unused-vars
export type GlobalStateDispatch = (action: WSDataFromServer) => void;

const initialState: GlobalState = {
  websocketSelf: { peerId: '' },
  websocket: { shared: {}, peers: {}, peersCount: 1 },
};

function reducer(prevState: GlobalState, action: WSDataFromServer) {
  // TODO: This reducer isn't great because it'll trigger a rerender for every component
  // even if only a very specific peer got updated. We should only rerender affected peers.
  const nextState = cloneDeep(prevState);

  switch (action.type) {
    case 'global-state':
      nextState.websocket = action.data;
      break;

    case 'self-state':
      nextState.websocketSelf = action.data;
      break;

    default:
      throw new Error('Unexpected action');
  }

  return nextState;
}

function getPeerState(globalState: GlobalState, peerId: string): PeerState {
  return globalState.websocket.peers[peerId];
}

export function getSelfState(globalState: GlobalState): PeerState {
  return getPeerState(globalState, globalState.websocketSelf.peerId);
}

export function useGlobalState() {
  return useReducer(reducer, initialState);
}
