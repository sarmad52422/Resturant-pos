import { Card } from '@restaurantos/ui';

export function SettingsPage() {
  return (
    <div className="p-7">
      <h1 className="text-3xl font-black">Settings</h1>
      <Card className="mt-6 p-6">
        <p className="font-semibold text-stone-600">
          Business, tax, receipt, stock policy, shift, shortcut, kitchen delay, table layout, and printer settings.
        </p>
      </Card>
    </div>
  );
}
