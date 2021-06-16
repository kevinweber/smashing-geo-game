import {
  BaseGlobalState,
  BaseSendPeerState,
  BaseSendSharedState,
  WSReceiveSelfState,
  WSSendJoin,
  WSSendPing,
  WSReceivePong,
  BaseReceiveGlobalState,
} from '../../utils/WSBaseTypes';

export type LatLng = google.maps.LatLng;

export type PeerState = {
  name?: string; // Name can be changed by peer
  emoji?: string;
  role?: 'host';
  guessLatLng?: LatLng | null;
  playAgain?: number; // Timestamp in ms
};

export type BootstrapData = {
  channel?: string;
}

export type Alert = {
  message?: string;
}

type Scores = { [peerId: string]: number };

export type RoundRecord = {
  // roundId == shared.endTime
  [roundId: string]: Scores;
}

type GlobalStateShared = {
  mapsApiKey?: string;
  view?: 'lobby' | 'play'| 'loading' | 'results';
  endTime?: number;
  startLatLng?: LatLng;
  rounds?: RoundRecord | null;
}

/** This state is available and in sync with every connected peer */
export type GlobalState = BaseGlobalState<GlobalStateShared, PeerState>;

type WSDataPeerState = BaseSendPeerState<PeerState>;
type WSDataSelfState = WSReceiveSelfState;
type WSDataGlobalState = BaseReceiveGlobalState<GlobalStateShared, PeerState>;
type WSDataSharedState = BaseSendSharedState<GlobalStateShared, PeerState>;

export type WSDataToServer = WSSendPing | WSSendJoin | WSDataPeerState | WSDataSharedState;
export type WSDataFromServer = WSReceivePong | WSDataSelfState | WSDataGlobalState;
