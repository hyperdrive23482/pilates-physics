import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
import Course from './pages/Course'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import SetPassword from './pages/SetPassword'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'

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
          path="/course"
          element={<Course />}
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
          path="/auth/callback"
          element={<AuthCallback />}
        />
      </Routes>
    </BrowserRouter>
  )
}
