import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import PageWrapper from './components/layout/PageWrapper'
import { workshopUrl } from './lib/workshop'

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
import Education from './pages/Education'
import PilatesPhysics101 from './pages/PilatesPhysics101'
import PilatesPhysics102 from './pages/PilatesPhysics102'
import Survey from './pages/Survey'
import SurveyPortal from './pages/SurveyPortal'
import WorkshopSalesPage from './pages/WorkshopSalesPage'
import PortalDashboard from './pages/PortalDashboard'
import WorkshopPortal from './pages/WorkshopPortal'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import SetPassword from './pages/SetPassword'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Help from './pages/Help'
import SubscriptionConfirmed from './pages/SubscriptionConfirmed'
import RegistrationSuccess from './pages/RegistrationSuccess'
import AdminGate from './components/admin/AdminGate'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminWorkshops from './pages/admin/AdminWorkshops'
import AdminWorkshopEdit from './pages/admin/AdminWorkshopEdit'
import AdminTools from './pages/admin/AdminTools'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminWorkshopFeedback from './pages/admin/AdminWorkshopFeedback'
import AdminAnimations from './pages/admin/AdminAnimations'
import AdminPoseStudio from './pages/admin/AdminPoseStudio'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminAnnouncementEdit from './pages/admin/AdminAnnouncementEdit'
import AdminContentDashboard from './pages/admin/AdminContentDashboard'
import AdminContentIdeas from './pages/admin/AdminContentIdeas'
import AdminContentPiece from './pages/admin/AdminContentPiece'
import AdminContentCalendar from './pages/admin/AdminContentCalendar'
import AdminContentBrain from './pages/admin/AdminContentBrain'
import AdminBlogPosts from './pages/admin/AdminBlogPosts'
import AdminBlogPostEdit from './pages/admin/AdminBlogPostEdit'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

// Any /workshops/PP-101-* or /workshops/PP-102-* URL (e.g. a Stripe cancel
// return) bounces to the branded landing page; everything else renders the
// generic sales page. workshopUrl is the single source of truth for the mapping.
function BrandedWorkshopRedirect() {
  const { slug } = useParams()
  const url = workshopUrl(slug)
  if (url.startsWith('/pilates-physics')) return <Navigate to={url} replace />
  return (
    <PageWrapper>
      <WorkshopSalesPage />
    </PageWrapper>
  )
}

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
        {/* New top-level pages */}
        <Route
          path="/education"
          element={
            <PageWrapper>
              <Education />
            </PageWrapper>
          }
        />
        <Route
          path="/pilates-physics-101"
          element={
            <PageWrapper>
              <PilatesPhysics101 />
            </PageWrapper>
          }
        />
        <Route
          path="/pilates-physics-102"
          element={
            <PageWrapper>
              <PilatesPhysics102 />
            </PageWrapper>
          }
        />
        <Route
          path="/survey/:slug"
          element={
            <PageWrapper>
              <Survey />
            </PageWrapper>
          }
        />
        {/* Back-compat redirect for emails/links already in flight */}
        <Route
          path="/survey-101"
          element={<Navigate to="/survey/PP-101-May-2026" replace />}
        />

        {/* PP-101/PP-102 slugs redirect to their branded page; any other workshop renders the generic sales page */}
        <Route
          path="/workshops/:slug"
          element={<BrandedWorkshopRedirect />}
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
          path="/workshops"
          element={<Navigate to="/education" replace />}
        />
        <Route
          path="/courses/PP-101-May-2026"
          element={<Navigate to="/pilates-physics-101" replace />}
        />
        <Route
          path="/courses"
          element={<Navigate to="/education" replace />}
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
        {/* Static portal routes must come BEFORE the dynamic /portal/:slug route */}
        <Route
          path="/portal/survey/:slug"
          element={<SurveyPortal />}
        />
        <Route
          path="/portal/survey-101"
          element={<Navigate to="/portal/survey/PP-101-May-2026" replace />}
        />
        <Route
          path="/portal/:slug"
          element={<WorkshopPortal />}
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
          path="/admin/workshops"
          element={
            <AdminGate>
              <AdminWorkshops />
            </AdminGate>
          }
        />
        <Route
          path="/admin/workshops/new"
          element={
            <AdminGate>
              <AdminWorkshopEdit />
            </AdminGate>
          }
        />
        <Route
          path="/admin/workshops/:slug/edit"
          element={
            <AdminGate>
              <AdminWorkshopEdit />
            </AdminGate>
          }
        />
        {/* Backward-compat redirects: /admin/webinars → /admin/workshops */}
        <Route
          path="/admin/webinars"
          element={<Navigate to="/admin/workshops" replace />}
        />
        <Route
          path="/admin/webinars/new"
          element={<Navigate to="/admin/workshops/new" replace />}
        />
        <Route
          path="/admin/webinars/:slug/edit"
          element={<RedirectWithSlug to="/admin/workshops/:slug/edit" />}
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
          path="/admin/workshop-feedback"
          element={
            <AdminGate>
              <AdminWorkshopFeedback />
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
          path="/admin/content/blog-posts"
          element={
            <AdminGate>
              <AdminBlogPosts />
            </AdminGate>
          }
        />
        <Route
          path="/admin/content/blog-posts/:id"
          element={
            <AdminGate>
              <AdminBlogPostEdit />
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
