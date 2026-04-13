export default function Terms() {
  const sectionStyle = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '6rem 2rem',
  }

  const h1Style = {
    fontFamily: '"DM Serif Display", serif',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    lineHeight: '1.15',
    color: 'var(--color-ink)',
    margin: '0 0 0.5rem',
  }

  const h2Style = {
    fontFamily: '"DM Serif Display", serif',
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
      <h1 style={h1Style}>Terms &amp; Conditions</h1>
      <p style={{ ...pStyle, color: 'var(--color-ink-dim)' }}>
        Effective date: April 13, 2026
      </p>

      <p style={pStyle}>
        These Terms &amp; Conditions ("Terms") govern your access to and use of the website
        located at pilatesphysics.com and any related services (collectively, the "Site"),
        operated by PWRHS Pilates LLC ("we," "us," or "our"), a California limited liability
        company.
      </p>
      <p style={pStyle}>
        By accessing or using the Site, you agree to be bound by these Terms. If you do not
        agree, please do not use the Site.
      </p>

      <h2 style={h2Style}>1. Use of the Site</h2>
      <p style={pStyle}>
        You may use the Site for lawful purposes only. You agree not to use the Site in any way
        that violates applicable federal, state, or local law or regulation. You must be at
        least 18 years old to create an account or purchase any products or services.
      </p>

      <h2 style={h2Style}>2. Accounts</h2>
      <p style={pStyle}>
        Certain features of the Site may require you to create an account. You are responsible
        for maintaining the confidentiality of your account credentials and for all activity
        that occurs under your account. You agree to notify us immediately of any unauthorized
        use of your account.
      </p>

      <h2 style={h2Style}>3. Intellectual Property</h2>
      <p style={pStyle}>
        All content on the Site — including text, graphics, logos, videos, course materials,
        diagrams, and software — is the property of PWRHS Pilates LLC or its licensors and is
        protected by copyright, trademark, and other intellectual property laws. You may not
        reproduce, distribute, modify, or create derivative works from any content on the Site
        without our prior written consent.
      </p>

      <h2 style={h2Style}>4. Courses &amp; Digital Products</h2>
      <p style={pStyle}>
        When you purchase or enroll in a course or webinar, you receive a limited, non-exclusive,
        non-transferable license to access that content for your personal, non-commercial use.
        You may not share, resell, or redistribute course materials.
      </p>

      <h2 style={h2Style}>5. Payments &amp; Refunds</h2>
      <p style={pStyle}>
        All prices are listed in US dollars. Payments are processed securely through Stripe.
        We do not store your credit card information on our servers. Refund eligibility depends
        on the specific product or service and will be stated at the time of purchase. If no
        refund policy is stated, all sales are final.
      </p>

      <h2 style={h2Style}>6. Disclaimer of Warranties</h2>
      <p style={pStyle}>
        The Site and all content are provided "as is" and "as available" without warranties of
        any kind, either express or implied. We do not warrant that the Site will be
        uninterrupted, error-free, or free of harmful components.
      </p>
      <p style={pStyle}>
        The educational content on this Site is for informational purposes only and does not
        constitute medical, fitness, or professional advice. Always consult a qualified
        professional before making changes to your practice or teaching.
      </p>

      <h2 style={h2Style}>7. Limitation of Liability</h2>
      <p style={pStyle}>
        To the fullest extent permitted by law, PWRHS Pilates LLC shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages arising out of or
        related to your use of the Site, even if we have been advised of the possibility of
        such damages. Our total liability for any claim shall not exceed the amount you paid
        us in the 12 months preceding the claim.
      </p>

      <h2 style={h2Style}>8. Indemnification</h2>
      <p style={pStyle}>
        You agree to indemnify and hold harmless PWRHS Pilates LLC and its members, employees,
        and agents from any claims, damages, losses, or expenses (including reasonable
        attorneys' fees) arising out of your use of the Site or violation of these Terms.
      </p>

      <h2 style={h2Style}>9. Third-Party Services</h2>
      <p style={pStyle}>
        The Site integrates with third-party services including Stripe (payment processing)
        and Kit (email marketing). We are not responsible for the content, practices, or
        policies of any third-party service. We encourage you to review their respective
        privacy policies.
      </p>

      <h2 style={h2Style}>10. Modifications</h2>
      <p style={pStyle}>
        We reserve the right to update these Terms at any time. Changes will be posted on this
        page with an updated effective date. Your continued use of the Site after changes are
        posted constitutes acceptance of the revised Terms.
      </p>

      <h2 style={h2Style}>11. Governing Law</h2>
      <p style={pStyle}>
        These Terms are governed by and construed in accordance with the laws of the State of
        California, without regard to its conflict of law principles. Any disputes arising
        under these Terms shall be resolved in the state or federal courts located in
        California.
      </p>

      <h2 style={h2Style}>12. Contact</h2>
      <p style={pStyle}>
        If you have questions about these Terms, please contact us at:
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
