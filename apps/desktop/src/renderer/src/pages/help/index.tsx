import { Card } from '@restaurantos/ui';
import { Keyboard, Lightbulb, Monitor, ShoppingBag } from 'lucide-react';

const shortcutGroups = [
  {
    title: 'App window',
    icon: Monitor,
    items: [
      ['Ctrl + Shift + M', 'Minimize the desktop app'],
      ['Ctrl + Shift + F', 'Maximize or restore the desktop app'],
      ['Ctrl + Shift + Q', 'Close the desktop app'],
    ],
  },
  {
    title: 'Cashier POS',
    icon: ShoppingBag,
    items: [
      ['F2', 'Focus and select item search'],
      ['Enter', 'Preview the first visible item when search is focused'],
      ['Alt + 1..9', 'Preview the numbered visible item'],
      ['Shift + 1..9', 'Preview the numbered item while search is focused'],
      ['Ctrl + 1..9', 'Preview the numbered visible item'],
      ['Enter', 'Confirm the item preview popup'],
      ['F5', 'Send the cart/order to kitchen'],
      ['F6', 'Open receipt preview'],
      ['Ctrl + P', 'Open receipt preview'],
      ['P', 'Print when receipt preview is open'],
      ['F7', 'Open payment popup'],
      ['F10', 'Open table screen'],
      ['Esc', 'Close open POS popups'],
      ['Ctrl + D', 'Delivery mode'],
      ['Ctrl + T', 'Takeaway mode'],
      ['Ctrl + I', 'Dine-in mode'],
    ],
  },
];

const tips = [
  'Use F2, type a few letters, then press Enter to preview the first result.',
  'Use Alt plus the number badge when multiple search results are visible.',
  'Receipt printing opens a preview first so the cashier can check the bill.',
  'Use the trash button to fix cart mistakes before sending the order.',
  'After an order exists, corrections need a reason and are saved in the audit log.',
  'Save printer details in Settings > Terminal hardware before rush hours.',
  'Keep payment and print popups closed when using item quick-add shortcuts.',
  'Table shortcuts and selected-line quantity controls will become safer after selected state is added.',
];

export function HelpPage() {
  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Help center</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Shortcuts and tips</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            A single place for cashier keys, window controls, and practical operating notes.
          </p>
        </div>
        <div className="flex h-12 items-center gap-3 rounded-2xl bg-sage px-4 text-sm font-black text-secondary">
          <Keyboard size={19} />
          Keyboard-first POS
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="space-y-5">
          {shortcutGroups.map((group) => (
            <Card key={group.title} className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">
                  <group.icon size={21} />
                </span>
                <h2 className="text-xl font-black text-espresso">{group.title}</h2>
              </div>
              <div className="mt-5 divide-y divide-line">
                {group.items.map(([keys, action]) => (
                  <div key={`${group.title}-${keys}-${action}`} className="grid grid-cols-[170px_1fr] gap-4 py-3">
                    <span className="inline-flex min-h-9 items-center rounded-xl bg-sage px-3 text-sm font-black text-secondary">
                      {keys}
                    </span>
                    <span className="flex items-center text-sm font-semibold text-label">{action}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">
              <Lightbulb size={21} />
            </span>
            <h2 className="text-xl font-black text-espresso">Helpful tips</h2>
          </div>
          <div className="mt-5 space-y-3">
            {tips.map((tip) => (
              <div key={tip} className="rounded-2xl bg-sage px-4 py-3 text-sm font-bold leading-6 text-label">
                {tip}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
