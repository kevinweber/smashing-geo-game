import { WSDataToServer } from './types';

export default function sendToServer(obj: WSDataToServer, ws: WebSocket) {
  ws.send(JSON.stringify(obj));
}
