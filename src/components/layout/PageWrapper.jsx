import Navbar from './Navbar'
import Footer from './Footer'
import AnnouncementBar from '../ui/AnnouncementBar'
import { useActiveAnnouncement } from '../../hooks/useActiveAnnouncement'

export default function PageWrapper({ children }) {
  const { announcement } = useActiveAnnouncement()
  const hasAnnouncement = !!announcement

  return (
    <div className="min-h-screen flex flex-col">
      {hasAnnouncement && <AnnouncementBar announcement={announcement} />}
      <Navbar hasAnnouncement={hasAnnouncement} />
      <main
        className="flex-1"
        style={{ paddingTop: hasAnnouncement ? '6.5rem' : '4rem' }}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}
