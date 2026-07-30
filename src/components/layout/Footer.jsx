import { Link } from 'react-router-dom'
import NewsletterForm from '../ui/NewsletterForm'

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
const SERIF = '"Source Serif 4", "Source Serif Pro", Georgia, serif'

const kickerStyle = {
  fontFamily: MONO,
  fontSize: '11.5px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
  margin: 0,
}

const eyebrowStyle = {
  fontFamily: MONO,
  fontSize: '11.5px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
  margin: '0 0 4px',
}

const colLinkStyle = {
  color: 'var(--color-ink)',
  fontSize: '14px',
  lineHeight: '1.4',
  padding: '2px 0',
  textDecoration: 'none',
  fontFamily: SERIF,
}

const logoTextStyle = {
  fontFamily: MONO,
  fontSize: '13px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  lineHeight: '1.05',
  display: 'block',
}

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-rule)',
        backgroundColor: 'var(--color-bg)',
        padding: '56px 0 32px',
      }}
    >
      <div className="pp-footer-inner pp-shell-inner">
        {/* Newsletter row */}
        <div className="pp-footer-news">
          <div>
            <div style={kickerStyle}>Newsletter</div>
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(28px, 3vw, 40px)',
                lineHeight: '1.1',
                letterSpacing: '-0.015em',
                fontWeight: 400,
                color: 'var(--color-ink)',
                margin: '12px 0 8px',
              }}
            >
              Occasional notes on the{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>physics</span>{' '}
              of Pilates equipment.
            </h3>
          </div>
          <NewsletterForm compact className="pp-kit-form--inline" />
        </div>

        {/* Columns */}
        <div className="pp-footer-cols">
          <div className="pp-footer-col pp-footer-brand">
            <Link
              to="/"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-start' }}
            >
              <span
                style={{
                  ...logoTextStyle,
                  color: 'var(--color-ink)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--color-accent)',
                  paddingBottom: '2px',
                }}
              >
                Pilates
              </span>
              <span style={{ ...logoTextStyle, color: 'var(--color-accent)', fontWeight: 500 }}>
                Physics
              </span>
            </Link>
            <p
              style={{
                color: 'var(--color-ink-muted)',
                fontSize: '13px',
                lineHeight: '1.4',
                maxWidth: '26ch',
                margin: '12px 0 0',
                fontFamily: SERIF,
              }}
            >
              Mechanics-grounded Pilates education.
            </p>
          </div>

          <div className="pp-footer-col">
            <div style={eyebrowStyle}>Navigation</div>
            <Link to="/about" style={colLinkStyle}>About Kaleen</Link>
            <Link to="/education" style={colLinkStyle}>Education</Link>
            <Link to="/blog" style={colLinkStyle}>Blog</Link>
            <Link to="/spring-calculator" style={colLinkStyle}>Spring Calculator</Link>
          </div>

          <div className="pp-footer-col">
            <div style={eyebrowStyle}>Admin</div>
            <Link to="/login" style={colLinkStyle}>Login</Link>
            <Link to="/help" style={colLinkStyle}>Help</Link>
            <Link to="/terms" style={colLinkStyle}>Terms</Link>
            <Link to="/privacy" style={colLinkStyle}>Privacy</Link>
          </div>

          <div className="pp-footer-col">
            <div style={eyebrowStyle}>Contact</div>
            <a href="mailto:hello@pilatesphysics.com" style={colLinkStyle}>hello@pilatesphysics.com</a>
            <a
              href="https://instagram.com/kaleenc_"
              target="_blank"
              rel="noopener noreferrer"
              style={colLinkStyle}
            >
              Instagram · @kaleenc_
            </a>
          </div>
        </div>

        {/* Bottom rail */}
        <div
          className="pp-footer-bottom"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '24px',
            fontSize: '10.5px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-dim)',
            fontFamily: MONO,
          }}
        >
          <span>&copy; 2026 Pilates Physics · Kaleen Canevari</span>
          <span>PILATESPHYSICS.COM</span>
        </div>
      </div>
    </footer>
  )
}
