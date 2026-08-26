export default function Privacy() {
  const sectionStyle = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '6rem 2rem',
  }

  const h1Style = {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    lineHeight: '1.15',
    color: 'var(--color-ink)',
    margin: '0 0 0.5rem',
  }

  const h2Style = {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.35rem',
    lineHeight: '1.3',
    color: 'var(--color-ink)',
    margin: '2.5rem 0 0.75rem',
  }

  const pStyle = {
    fontSize: '0.95rem',
    lineHeight: '1.75',
    color: 'var(--color-ink-muted)',
    margin: '0 0 1rem',
  }

  const listStyle = {
    fontSize: '0.95rem',
    lineHeight: '1.75',
    color: 'var(--color-ink-muted)',
    margin: '0 0 1rem',
    paddingLeft: '1.5rem',
  }

  return (
    <div style={sectionStyle}>
      <p
        style={{
          fontSize: '0.7rem',
          fontWeight: '600',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: '1.25rem',
        }}
      >
        Legal
      </p>
      <h1 style={h1Style}>Privacy Policy</h1>
      <p style={{ ...pStyle, color: 'var(--color-ink-dim)' }}>
        Effective date: August 26, 2026
      </p>

      <p style={pStyle}>
        PWRHS Pilates LLC ("we," "us," or "our") operates the website at pilatesphysics.com
        (the "Site"). This Privacy Policy explains how we collect, use, and protect your
        personal information when you visit the Site or use our services.
      </p>

      <h2 style={h2Style}>1. Information We Collect</h2>
      <p style={pStyle}>
        We may collect the following types of information:
      </p>
      <ul style={listStyle}>
        <li>
          <strong style={{ color: 'var(--color-ink)' }}>Information you provide:</strong>{' '}
          Name, email address, and any other information you submit through forms on the Site
          (e.g., waitlist signups, account registration, purchases).
        </li>
        <li>
          <strong style={{ color: 'var(--color-ink)' }}>Payment information:</strong>{' '}
          Payment details are collected and processed securely by Stripe. We do not store
          credit card numbers on our servers. Stripe's privacy policy governs how they handle
          your payment data.
        </li>
        <li>
          <strong style={{ color: 'var(--color-ink)' }}>Automatically collected data:</strong>{' '}
          When you visit the Site, we may automatically collect your IP address, browser type,
          device information, pages visited, and referring URL through cookies or similar
          technologies.
        </li>
        <li>
          <strong style={{ color: 'var(--color-ink)' }}>Account activity logs:</strong>{' '}
          When you sign in, start a purchase, or open material in the member portal, our
          servers record what happened, when it happened, the IP address the request came
          from, and your browser user agent. These records are written by our servers rather
          than by your browser, and they are stored in a log that can be added to but not
          edited or overwritten.
        </li>
      </ul>

      <h2 style={h2Style}>2. How We Use Your Information</h2>
      <p style={pStyle}>
        We use the information we collect to:
      </p>
      <ul style={listStyle}>
        <li>Provide, maintain, and improve the Site and our services</li>
        <li>Process transactions and send related information (confirmations, receipts)</li>
        <li>Send you updates, marketing communications, and other information related to
          Pilates Physics (you can opt out at any time)</li>
        <li>Respond to your comments, questions, and support requests</li>
        <li>Monitor and analyze usage trends to improve user experience</li>
        <li>Detect and investigate fraud, secure your account, and defend against payment
          disputes and chargebacks</li>
        <li>Understand which workshop materials are actually used, so we can make more of
          what people find useful</li>
      </ul>

      <h2 style={h2Style}>3. Email Communications</h2>
      <p style={pStyle}>
        When you join our waitlist or create an account, you may receive email communications
        from us. We use Kit (kit.com) to manage our email list. Your email address is stored
        by Kit on our behalf. You can unsubscribe at any time by clicking the unsubscribe link
        in any email. We will never sell your email address to third parties.
      </p>

      <h2 style={h2Style}>4. Cookies &amp; Tracking</h2>
      <p style={pStyle}>
        We may use cookies and similar tracking technologies to collect information about your
        browsing activity. Cookies are small text files stored on your device. You can control
        cookie settings through your browser preferences. Disabling cookies may affect the
        functionality of certain parts of the Site.
      </p>
      <p style={pStyle}>
        The account activity logs described in Section 1 are recorded by our servers as part
        of handling your request. They do not rely on cookies, they do not store anything on
        your device, and they are not shared with advertising networks.
      </p>

      <h2 style={h2Style}>5. Third-Party Services</h2>
      <p style={pStyle}>
        We use third-party services to help operate the Site. These services may have access
        to your personal information only to perform tasks on our behalf and are obligated not
        to disclose or use it for other purposes. Our third-party providers may include:
      </p>
      <ul style={listStyle}>
        <li>Supabase (authentication and database)</li>
        <li>Kit, kit.com (email marketing and waitlist management)</li>
        <li>Stripe (payment processing)</li>
        <li>Analytics providers</li>
      </ul>

      <h2 style={h2Style}>6. Data Retention</h2>
      <p style={pStyle}>
        We retain your personal information for as long as your account is active or as needed
        to provide you services. If you wish to delete your account or request that we no
        longer use your information, please contact us at the address below. We will retain
        and use your information as necessary to comply with legal obligations, resolve
        disputes, and enforce our agreements.
      </p>
      <p style={pStyle}>
        Account activity logs are kept in full detail for 26 months. We chose that period
        because card network dispute windows commonly run 120 days but can extend
        considerably longer through pre-arbitration and arbitration, and we need the records
        to still exist when a dispute arrives. After 26 months we automatically remove the IP
        address and browser user agent from those records and keep only the remaining history
        of the event.
      </p>
      <p style={pStyle}>
        If an account is deleted, its activity records are unlinked from the account but the
        records themselves are retained for the period above. These records are the evidence
        we rely on to answer a payment dispute, and a dispute can be raised long after an
        account is closed.
      </p>

      <h2 style={h2Style}>7. Data Security</h2>
      <p style={pStyle}>
        We take reasonable measures to protect your personal information from unauthorized
        access, alteration, disclosure, or destruction. However, no method of transmission
        over the Internet or electronic storage is 100% secure, and we cannot guarantee
        absolute security.
      </p>

      <h2 style={h2Style}>8. Your California Privacy Rights</h2>
      <p style={pStyle}>
        If you are a California resident, you have certain rights under the California Consumer
        Privacy Act (CCPA), including the right to:
      </p>
      <ul style={listStyle}>
        <li>Know what personal information we collect, use, and disclose about you</li>
        <li>Request deletion of your personal information</li>
        <li>Opt out of the sale of your personal information (we do not sell personal
          information)</li>
        <li>Not be discriminated against for exercising your privacy rights</li>
      </ul>
      <p style={pStyle}>
        To exercise any of these rights, please contact us at hello@pilatesphysics.com.
      </p>

      <h2 style={h2Style}>9. Your Rights Under UK and EU Data Protection Law</h2>
      <p style={pStyle}>
        If you are located in the United Kingdom or the European Economic Area, you have the
        right to access the personal information we hold about you, to have it corrected or
        deleted, to receive a copy of it, to object to or restrict certain processing, and to
        lodge a complaint with your local supervisory authority.
      </p>
      <p style={pStyle}>
        Most of your information is processed so that we can perform our contract with you,
        which is how we deliver the workshops and materials you purchase. Account activity
        logs, including IP addresses, are processed on the basis of our legitimate interests
        in preventing fraud, keeping your account secure, and defending against payment
        disputes. You can object to that processing, though we may need to continue it where
        we have compelling grounds, such as an open dispute over a payment.
      </p>
      <p style={pStyle}>
        To exercise any of these rights, contact us at hello@pilatesphysics.com.
      </p>

      <h2 style={h2Style}>10. Children's Privacy</h2>
      <p style={pStyle}>
        The Site is not directed to individuals under the age of 18. We do not knowingly
        collect personal information from children. If we become aware that we have
        inadvertently collected information from a child under 18, we will take steps to
        delete that information.
      </p>

      <h2 style={h2Style}>11. Changes to This Policy</h2>
      <p style={pStyle}>
        We may update this Privacy Policy from time to time. Changes will be posted on this
        page with an updated effective date. We encourage you to review this page periodically.
      </p>

      <h2 style={h2Style}>12. Contact</h2>
      <p style={pStyle}>
        If you have questions about this Privacy Policy or your personal data, please contact
        us at:
      </p>
      <ul style={listStyle}>
        <li>PWRHS Pilates LLC</li>
        <li>
          <a href="mailto:hello@pilatesphysics.com" style={{ color: 'var(--color-accent)' }}>
            hello@pilatesphysics.com
          </a>
        </li>
      </ul>
    </div>
  )
}
