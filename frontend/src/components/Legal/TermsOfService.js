import React from 'react';

export default function TermsOfService() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <h1 className="card-title" style={{ fontSize: 24, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          Last updated: March 2026 &nbsp;|&nbsp; <a href="https://palians.com" style={{ color: 'var(--accent)' }}>palians.com</a>
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using the Amazon Seller Toolkit ("the Service") provided by Palians, you agree to be bound
          by these Terms of Service. If you do not agree to these terms, please do not use the Service.
        </Section>

        <Section title="2. Description of Service">
          Amazon Seller Toolkit is a SaaS platform designed to help Amazon sellers grow their businesses. The Service
          includes the following tools:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Profit Calculator — estimate product margins and fees</li>
            <li>Keyword Research — discover high-traffic search terms</li>
            <li>AI Listing Optimizer — generate and improve product listings using AI</li>
            <li>Competitor Monitoring — track competitor products and pricing</li>
          </ul>
        </Section>

        <Section title="3. User Accounts &amp; Registration">
          You must register for an account to access the Service. You are responsible for maintaining the
          confidentiality of your account credentials and for all activities that occur under your account.
          You agree to provide accurate and complete information during registration and to keep this information
          up to date. You must be at least 13 years of age to create an account.
        </Section>

        <Section title="4. Subscription Plans &amp; Payments">
          The Service offers free and paid subscription plans. Paid plans are billed on a recurring basis.
          Payments are processed securely through Razorpay (for Indian users) and PayPal (for international
          users). By subscribing to a paid plan, you authorize us to charge your chosen payment method.
          Subscription fees are non-refundable except as required by applicable law. We reserve the right to
          modify pricing with 30 days' notice.
        </Section>

        <Section title="5. Acceptable Use Policy">
          You agree not to:
          <ul style={{ marginTop: 8, paddingLeft: 24, lineHeight: 2 }}>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorised access to any part of the Service</li>
            <li>Reverse engineer or decompile any part of the Service</li>
            <li>Use automated scraping or bots to extract data from the Service</li>
            <li>Share your account credentials with third parties</li>
            <li>Violate Amazon's Terms of Service or any applicable laws</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          All content, features, and functionality of the Service — including but not limited to software,
          text, graphics, logos, and data — are the exclusive property of Palians and are protected by
          applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable
          licence to use the Service for your personal or business purposes only.
        </Section>

        <Section title="7. Data Accuracy Disclaimer">
          The Amazon Seller Toolkit provides estimates and analysis based on available data. All calculations,
          keyword metrics, and competitor insights are <strong>estimates only and are not guarantees</strong> of
          actual results. Market conditions, Amazon fee structures, and other factors may change at any time.
          Palians is not responsible for any business decisions made based on information provided by the Service.
        </Section>

        <Section title="8. Limitation of Liability">
          To the fullest extent permitted by law, Palians shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages arising from your use of the Service, including lost
          profits, loss of data, or business interruption. Our total liability shall not exceed the amount
          you paid for the Service in the three months preceding the claim.
        </Section>

        <Section title="9. Termination">
          We reserve the right to suspend or terminate your account at our discretion if you violate these
          Terms of Service. You may cancel your account at any time through your account settings. Upon
          termination, your right to use the Service will immediately cease.
        </Section>

        <Section title="10. Governing Law">
          These Terms of Service shall be governed by and construed in accordance with the laws of India.
          Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts
          located in India.
        </Section>

        <Section title="11. Contact Information">
          If you have any questions about these Terms of Service, please contact us:
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
