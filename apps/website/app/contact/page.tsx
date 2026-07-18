import { Button, Text } from '@briefly/ui';

export default function ContactPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Contact
      </Text>
      <p className="lead">Reach the Briefly team for support, partnerships, or press inquiries.</p>

      <form
        className="contact-form"
        action="mailto:support@briefly.app"
        method="post"
        encType="text/plain"
      >
        <label>
          Name
          <input type="text" name="name" required autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Topic
          <select name="topic" defaultValue="support">
            <option value="support">Support</option>
            <option value="partnership">Partnership</option>
            <option value="press">Press</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Message
          <textarea name="message" rows={6} required />
        </label>
        <Button type="submit" variant="primary">
          Send email
        </Button>
      </form>

      <p className="content-prose" style={{ marginTop: '2rem' }}>
        Or email us directly at <a href="mailto:support@briefly.app">support@briefly.app</a>.
      </p>
    </main>
  );
}
