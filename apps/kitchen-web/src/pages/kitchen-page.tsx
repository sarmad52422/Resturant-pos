import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Card } from '@restaurantos/ui';
import type { KitchenTicketItemView } from '@restaurantos/shared';
import { Clock, Flame, Volume2 } from 'lucide-react';
import { kitchenSocket } from '../lib/kitchen-socket';

const demoTickets: KitchenTicketItemView[] = [
  {
    id: 'ticket-1',
    orderNumber: 'A-1001',
    stationSlug: 'burger',
    orderType: 'DINE_IN',
    tableName: 'T4',
    quantity: 2,
    itemName: 'Zinger Burger',
    variationName: 'Double',
    modifiers: ['Extra spicy', 'No onion'],
    addOns: ['Extra cheese'],
    notes: 'Serve one without mayo.',
    status: 'NEW',
    sentAt: new Date(Date.now() - 6 * 60_000).toISOString(),
  },
  {
    id: 'ticket-2',
    orderNumber: 'A-1002',
    stationSlug: 'juice',
    orderType: 'TAKEAWAY',
    quantity: 3,
    itemName: 'Mango Juice 500ml',
    modifiers: ['Less ice'],
    addOns: [],
    status: 'PREPARING',
    sentAt: new Date(Date.now() - 13 * 60_000).toISOString(),
  },
];

export function KitchenPage() {
  const { station = 'all' } = useParams();
  const [tickets, setTickets] = useState(demoTickets);

  useEffect(() => {
    kitchenSocket.connect();
    kitchenSocket.emit('kitchen.join', { station });
    kitchenSocket.on('order.sent_to_kitchen', (ticket: KitchenTicketItemView) => {
      setTickets((current) => [ticket, ...current]);
    });

    return () => {
      kitchenSocket.off('order.sent_to_kitchen');
      kitchenSocket.disconnect();
    };
  }, [station]);

  const visibleTickets = useMemo(
    () => tickets.filter((ticket) => station === 'all' || ticket.stationSlug === station),
    [station, tickets],
  );

  return (
    <main className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-subtle">Kitchen screen</p>
          <h1 className="mt-2 text-5xl font-black capitalize text-espresso">{station} station</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="green">Live</Badge>
          <Button variant="secondary" icon={<Volume2 size={20} />}>
            Sound
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {visibleTickets.map((ticket) => {
          const minutes = Math.floor((Date.now() - Date.parse(ticket.sentAt)) / 60_000);
          const delayed = minutes >= 10;

          return (
            <Card
              key={ticket.id}
              className={[
                'p-5',
                delayed ? 'bg-mint' : 'bg-white',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-black">{ticket.orderNumber}</h2>
                    {delayed ? <Flame className="text-primary" size={26} /> : null}
                  </div>
                  <p className="mt-1 text-lg font-bold text-subtle">
                    {ticket.orderType.replace('_', ' ')} {ticket.tableName ? `- ${ticket.tableName}` : ''}
                  </p>
                </div>
                <Badge tone={ticket.status === 'READY' ? 'green' : 'orange'}>{ticket.status}</Badge>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-espresso text-3xl font-black text-white">
                  {ticket.quantity}
                </span>
                <div>
                  <h3 className="text-2xl font-black">{ticket.itemName}</h3>
                  {ticket.variationName ? (
                    <p className="text-lg font-bold text-primary">{ticket.variationName}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 space-y-2 text-lg font-bold text-label">
                {[...ticket.modifiers, ...ticket.addOns].map((line) => (
                  <p key={line}>- {line}</p>
                ))}
                {ticket.notes ? <p className="rounded-xl bg-sage p-3 text-secondary">{ticket.notes}</p> : null}
              </div>

              <div className="mt-6 flex items-center justify-between pt-4">
                <span className="inline-flex items-center gap-2 text-lg font-black">
                  <Clock size={22} /> {minutes}m
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary">Preparing</Button>
                  <Button>Ready</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
