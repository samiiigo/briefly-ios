import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Download Briefly. No subscriptions built into the app.',
};

export default function PricingPage() {
  return (
    <main className="page">
      <h1>Pricing</h1>
      <p>
        Briefly has no subscriptions built into the app. Use on-device processing or bring your own
        API keys for cloud providers.
      </p>
    </main>
  );
}
