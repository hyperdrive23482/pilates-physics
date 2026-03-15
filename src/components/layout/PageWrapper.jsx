import Navbar from './Navbar'
import Footer from './Footer'

export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* pt-16 clears the fixed navbar (64px = h-16) */}
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  )
}
