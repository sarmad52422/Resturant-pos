import { io } from 'socket.io-client';

const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:4300';

export const kitchenSocket = io(`${wsUrl}/kitchen`, {
  autoConnect: false,
  transports: ['websocket'],
});
