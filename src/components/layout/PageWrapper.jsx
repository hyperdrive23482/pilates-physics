import Navbar from './Navbar'
import Footer from './Footer'
import EarlyBirdBanner from '../ui/EarlyBirdBanner'

export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <EarlyBirdBanner />
      <Navbar />
      <main className="flex-1" style={{ paddingTop: '6.5rem' }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
