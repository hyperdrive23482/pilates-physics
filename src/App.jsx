import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PageWrapper from './components/layout/PageWrapper'
import Landing from './pages/Landing'
import About from './pages/About'
import Course from './pages/Course'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  return (
    <BrowserRouter>
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
          path="/auth/callback"
          element={<AuthCallback />}
        />
      </Routes>
    </BrowserRouter>
  )
}
