import Link from 'next/link';

export default function LandingPage() {
  return (
    <section className="hero">
      <h1>Briefly</h1>
      <p>
        Capture meetings, lectures, and voice notes. Get clean transcripts and structured summaries
        — privately on device or with the cloud providers you choose.
      </p>
      <div className="cta-row">
        <Link className="button button-primary" href="/pricing">
          Download
        </Link>
        <Link className="button button-secondary" href="/features">
          See features
        </Link>
      </div>
    </section>
  );
}
