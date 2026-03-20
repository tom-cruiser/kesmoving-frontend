import { io, Socket } from 'socket.io-client';

let trackingSocket: Socket | null = null;
let chatSocket: Socket | null = null;

function getToken(): string {
  return localStorage.getItem('token') || '';
}

export function getTrackingSocket(): Socket {
  if (!trackingSocket || !trackingSocket.connected) {
    trackingSocket = io('/tracking', {
      auth: { token: getToken() },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return trackingSocket;
}

export function getChatSocket(): Socket {
  if (!chatSocket || !chatSocket.connected) {
    chatSocket = io('/chat', {
      auth: { token: getToken() },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return chatSocket;
}

export function disconnectAll(): void {
  trackingSocket?.disconnect();
  chatSocket?.disconnect();
  trackingSocket = null;
  chatSocket = null;
}
