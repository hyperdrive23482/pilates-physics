import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import PageWrapper from './components/layout/PageWrapper'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
import Landing from './pages/Landing'
import About from './pages/About'
import WebinarCatalog from './pages/WebinarCatalog'
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
import SubscriptionConfirmed from './pages/SubscriptionConfirmed'

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
        <Route
          path="/courses"
          element={
            <PageWrapper>
              <WebinarCatalog />
            </PageWrapper>
          }
        />
        <Route
          path="/courses/:slug"
          element={
            <PageWrapper>
              <WebinarSalesPage />
            </PageWrapper>
          }
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
      </Routes>
    </BrowserRouter>
  )
}
