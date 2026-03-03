import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <h1 className="card-title" style={{ fontSize: 24, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          Last updated: March 2026 &nbsp;|&nbsp; <a href="https://palians.com" style={{ color: 'var(--accent)' }}>palians.com</a>
        </p>

        <Section title="1. Information We Collect">
          We collect the following types of information when you use Amazon Seller Toolkit:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Account information</strong> — name, email address, and country</li>
            <li><strong>Payment information</strong> — processed securely by Razorpay or PayPal; we do not store full card details</li>
            <li><strong>Usage data</strong> — pages visited, features used, and actions taken within the Service</li>
            <li><strong>Technical data</strong> — IP address, browser type, device information, and cookies</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          We use the information we collect to:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Provide, operate, and improve the Service</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send transactional emails (account confirmation, password reset, invoices)</li>
            <li>Respond to support requests and inquiries</li>
            <li>Analyse usage patterns to improve the user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Data Storage &amp; Security">
          Your data is stored on secure servers. We implement industry-standard security measures including
          encryption in transit (HTTPS/TLS) and at rest, access controls, and regular security reviews.
          While we strive to protect your data, no method of transmission over the internet is 100% secure.
          We encourage you to use a strong, unique password for your account.
        </Section>

        <Section title="4. Third-Party Services">
          We use the following third-party services that may process your data:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Razorpay</strong> — payment processing for Indian users (<a href="https://razorpay.com/privacy/" style={{ color: 'var(--accent)' }}>Privacy Policy</a>)</li>
            <li><strong>PayPal</strong> — payment processing for international users (<a href="https://www.paypal.com/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>)</li>
            <li><strong>Claude AI by Anthropic</strong> — powers the AI Listing Optimizer feature (<a href="https://www.anthropic.com/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>)</li>
            <li><strong>Amazon API</strong> — used to fetch product and marketplace data</li>
          </ul>
          Each third-party service is governed by its own privacy policy. We recommend reviewing their policies.
        </Section>

        <Section title="5. Cookies &amp; Local Storage">
          We use cookies and browser local storage to maintain your session, remember your preferences (such as
          theme and country selection), and analyse usage. You can disable cookies in your browser settings,
          but this may affect the functionality of the Service.
        </Section>

        <Section title="6. User Rights">
          You have the following rights regarding your personal data:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            <li><strong>Update</strong> — correct inaccurate or incomplete data via your account settings</li>
            <li><strong>Delete</strong> — request deletion of your account and associated data</li>
            <li><strong>Portability</strong> — request an export of your data in a common format</li>
          </ul>
          To exercise these rights, please contact us at <a href="mailto:support@palians.com" style={{ color: 'var(--accent)' }}>support@palians.com</a>.
        </Section>

        <Section title="7. Data Retention">
          We retain your personal data for as long as your account is active or as needed to provide the Service.
          After account deletion, we may retain certain data for up to 90 days for backup and legal compliance
          purposes, after which it is permanently deleted.
        </Section>

        <Section title="8. Children's Privacy">
          The Service is not directed to children under the age of 13. We do not knowingly collect personal
          information from children under 13. If you believe a child under 13 has provided us with personal
          information, please contact us and we will promptly delete it.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes by
          posting the new policy on this page with an updated date and, where appropriate, by email. Your
          continued use of the Service after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="10. Contact Information">
          If you have any questions or concerns about this Privacy Policy, please contact us:
          <br /><br />
          <strong>Palians</strong><br />
          Email: <a href="mailto:support@palians.com" style={{ color: 'var(--accent)' }}>support@palians.com</a><br />
          Website: <a href="https://palians.com" style={{ color: 'var(--accent)' }}>palians.com</a>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>{children}</p>
    </div>
  );
}
