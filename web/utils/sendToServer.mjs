export default function sendToServer(data, ws) {
  ws.send(JSON.stringify(data));
}
