import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import PageWrapper from './components/layout/PageWrapper'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function RedirectWithSlug({ to }) {
  const { slug } = useParams()
  return <Navigate to={to.replace(':slug', slug)} replace />
}
import Landing from './pages/Landing'
import About from './pages/About'
import WebinarCatalog from './pages/WebinarCatalog'
import Courses from './pages/Courses'
import WebinarSalesPage from './pages/WebinarSalesPage'
import PortalDashboard from './pages/PortalDashboard'
import WebinarPortal from './pages/WebinarPortal'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import SetPassword from './pages/SetPassword'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Help from './pages/Help'
import Assist from './pages/Assist'
import SubscriptionConfirmed from './pages/SubscriptionConfirmed'
import RegistrationSuccess from './pages/RegistrationSuccess'
import AdminGate from './components/admin/AdminGate'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminWebinars from './pages/admin/AdminWebinars'
import AdminWebinarEdit from './pages/admin/AdminWebinarEdit'
import AdminTools from './pages/admin/AdminTools'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminAnimations from './pages/admin/AdminAnimations'
import AdminPoseStudio from './pages/admin/AdminPoseStudio'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminAnnouncementEdit from './pages/admin/AdminAnnouncementEdit'
import AdminContentDashboard from './pages/admin/AdminContentDashboard'
import AdminContentIdeas from './pages/admin/AdminContentIdeas'
import AdminContentPiece from './pages/admin/AdminContentPiece'
import AdminContentCalendar from './pages/admin/AdminContentCalendar'
import AdminContentBrain from './pages/admin/AdminContentBrain'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Landing />
            </PageWrapper>
          }
        />
        <Route
          path="/about"
          element={
            <PageWrapper>
              <About />
            </PageWrapper>
          }
        />
        {/* Hide the PP-101 standalone sales page — must come BEFORE the dynamic route */}
        <Route
          path="/workshops/PP-101-May-2026"
          element={<Navigate to="/workshops" replace />}
        />
        <Route
          path="/workshops"
          element={
            <PageWrapper>
              <Courses />
            </PageWrapper>
          }
        />
        <Route
          path="/workshops/:slug"
          element={
            <PageWrapper>
              <WebinarSalesPage />
            </PageWrapper>
          }
        />
        <Route
          path="/workshops/:slug/success"
          element={
            <PageWrapper>
              <RegistrationSuccess />
            </PageWrapper>
          }
        />
        {/* Backward-compat redirects */}
        <Route
          path="/courses/PP-101-May-2026"
          element={<Navigate to="/workshops" replace />}
        />
        <Route
          path="/courses"
          element={<Navigate to="/workshops" replace />}
        />
        <Route
          path="/courses/:slug"
          element={<RedirectWithSlug to="/workshops/:slug" />}
        />
        <Route
          path="/courses/:slug/success"
          element={<RedirectWithSlug to="/workshops/:slug/success" />}
        />
        <Route
          path="/portal"
          element={<PortalDashboard />}
        />
        <Route
          path="/portal/:slug"
          element={<WebinarPortal />}
        />
        {/* Redirect old /course path */}
        <Route
          path="/course"
          element={<Navigate to="/portal" replace />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/signup"
          element={<Signup />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/set-password"
          element={<SetPassword />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />
        <Route
          path="/terms"
          element={
            <PageWrapper>
              <Terms />
            </PageWrapper>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageWrapper>
              <Privacy />
            </PageWrapper>
          }
        />
        <Route
          path="/help"
          element={
            <PageWrapper>
              <Help />
            </PageWrapper>
          }
        />
        <Route
          path="/assist"
          element={
            <PageWrapper>
              <Assist />
            </PageWrapper>
          }
        />
        <Route
          path="/subscription-confirmed"
          element={
            <PageWrapper>
              <SubscriptionConfirmed />
            </PageWrapper>
          }
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
        <Route
          path="/admin"
          element={
            <AdminGate>
              <AdminDashboard />
            </AdminGate>
          }
        />
        <Route
          path="/admin/webinars"
          element={
            <AdminGate>
              <AdminWebinars />
            </AdminGate>
          }
        />
        <Route
          path="/admin/webinars/new"
          element={
            <AdminGate>
              <AdminWebinarEdit />
            </AdminGate>
          }
        />
        <Route
          path="/admin/webinars/:slug/edit"
          element={
            <AdminGate>
              <AdminWebinarEdit />
            </AdminGate>
          }
        />
        <Route
          path="/admin/tools"
          element={
            <AdminGate>
              <AdminTools />
            </AdminGate>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminGate>
              <AdminUsers />
            </AdminGate>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminGate>
              <AdminAnalytics />
            </AdminGate>
          }
        />
        <Route
          path="/admin/animations"
          element={
            <AdminGate>
              <AdminAnimations />
            </AdminGate>
          }
        />
        <Route
          path="/admin/pose-studio"
          element={
            <AdminGate>
              <AdminPoseStudio />
            </AdminGate>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <AdminGate>
              <AdminAnnouncements />
            </AdminGate>
          }
        />
        <Route
          path="/admin/announcements/new"
          element={
            <AdminGate>
              <AdminAnnouncementEdit />
            </AdminGate>
          }
        />
        <Route
          path="/admin/announcements/:id/edit"
          element={
            <AdminGate>
              <AdminAnnouncementEdit />
            </AdminGate>
          }
        />
        <Route
          path="/admin/content"
          element={
            <AdminGate>
              <AdminContentDashboard />
            </AdminGate>
          }
        />
        <Route
          path="/admin/content/ideas"
          element={
            <AdminGate>
              <AdminContentIdeas />
            </AdminGate>
          }
        />
        <Route
          path="/admin/content/pieces/:id"
          element={
            <AdminGate>
              <AdminContentPiece />
            </AdminGate>
          }
        />
        <Route
          path="/admin/content/calendar"
          element={
            <AdminGate>
              <AdminContentCalendar />
            </AdminGate>
          }
        />
        <Route
          path="/admin/content/brain"
          element={
            <AdminGate>
              <AdminContentBrain />
            </AdminGate>
          }
        />
        <Route
          path="/blog"
          element={
            <PageWrapper>
              <Blog />
            </PageWrapper>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <PageWrapper>
              <BlogPost />
            </PageWrapper>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
