export type Channel = string;

/** Initiating peer sends a message to the server */
export type WSSendJoin = {
    type: 'join';
    channel: Channel;
};

export type WSSendPing = {
    type: 'ping';
    channel: Channel;
};

export type WSReceivePong = {
    type: 'pong';
    channel: Channel;
};

/** State for intiating peer sent FROM server */
export type WSReceiveSelfState = {
    type: 'self-state';
    channel: Channel;
    data: { peerId: string };
};

/** This state is available and in sync with every connected peer */
export type BaseGlobalState<TSharedState, TPeerState> = {
    // Every socket has this state but its values are unique per peer
    websocketSelf?: {
      peerId?: string;
    };
    websocket: {
      // This data is specified by the client and broadcasted through the socket without changes
      shared: TSharedState
      // This data is specified by the WebSocket
      peers: Record<string, TPeerState>;
      peersCount: number;
    }
  };

/** State for intiating peer sent TO server */
export type BaseSendPeerState<TPeerState> = {
    type: 'peer-state';
    channel: Channel;
    data: TPeerState;
};

/** Global state sent FROM server */
export type BaseReceiveGlobalState<TSharedState, TPeerState> = {
    type: 'global-state';
    channel: Channel;
    data: BaseGlobalState<TSharedState, TPeerState>['websocket'];
};

/** Shared state sent TO server */
export type BaseSendSharedState<TSharedState, TPeerState> = {
    type: 'shared-state';
    channel: Channel;
    data: BaseGlobalState<TSharedState, TPeerState>['websocket']['shared'];
};
