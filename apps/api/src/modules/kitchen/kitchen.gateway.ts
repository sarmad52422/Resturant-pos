import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface KitchenTicketItemView {
  id: string;
  orderNumber: string;
  stationSlug: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableName?: string;
  quantity: number;
  itemName: string;
  variationName?: string;
  modifiers: string[];
  addOns: string[];
  notes?: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  sentAt: string;
}

@WebSocketGateway({
  namespace: 'kitchen',
  cors: {
    origin: '*',
  },
})
export class KitchenGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('kitchen.connected', { connected: true });
  }

  @SubscribeMessage('kitchen.join')
  joinStation(@ConnectedSocket() client: Socket, @MessageBody() body: { station?: string }) {
    const station = body.station ?? 'all';
    void client.join(`station:${station}`);
    return { station };
  }

  emitOrderSentToKitchen(ticket: KitchenTicketItemView) {
    this.server.to('station:all').emit('order.sent_to_kitchen', ticket);
    this.server.to(`station:${ticket.stationSlug}`).emit('order.sent_to_kitchen', ticket);
  }
}
