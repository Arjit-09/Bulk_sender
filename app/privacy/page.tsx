import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.6', color: '#1e293b' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#0f172a' }}>Zenith Service — Privacy Policy</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>Effective Date: September 2026 | Last Updated: September 2026</p>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>1. Introduction</h2>
        <p>
          Zenith Service ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you visit our website or interact with our communication services, including SMS notifications.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>2. Information We Collect</h2>
        <p>
          We collect personal information that you provide to us directly, including your name, email address, phone number, and details related to your service inquiries or account support.
        </p>
      </section>

      <section style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>3. SMS / Mobile Information Privacy Clause</h2>
        <p style={{ fontWeight: 600, color: '#0f172a' }}>
          No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.
        </p>
        <p style={{ marginTop: '8px' }}>
          All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties or marketing affiliates under any circumstances.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>4. How We Use Your Information</h2>
        <p>We use your information solely to:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li>Provide customer care and respond to inquiries.</li>
          <li>Send transactional updates, order status, and account notifications.</li>
          <li>Maintain and improve our customer support operations.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>5. Opt-Out and Support</h2>
        <p>
          You can cancel the SMS service at any time. Just text <strong>STOP</strong> to our number. After you send the SMS message <strong>STOP</strong> to us, we will send you an SMS message to confirm that you have been unsubscribed. After this, you will no longer receive SMS messages from us.
        </p>
        <p style={{ marginTop: '8px' }}>
          If you are experiencing issues with the messaging program you can reply with the keyword <strong>HELP</strong> for more assistance, or contact us directly at support@uberip.com.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>6. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at:
        </p>
        <p style={{ marginTop: '4px' }}>
          <strong>Zenith Service</strong><br />
          Email: support@uberip.com / zenithservice@uberip.com<br />
          Phone: +1 239-494-5974
        </p>
      </section>
    </div>
  );
}
