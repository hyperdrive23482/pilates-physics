import { useState } from 'react'

export function useEnrollment() {
  const [enrolled, setEnrolled] = useState(() => {
    return localStorage.getItem('pp_enrolled') === 'true'
  })

  function enroll() {
    localStorage.setItem('pp_enrolled', 'true')
    setEnrolled(true)
  }

  function unenroll() {
    localStorage.removeItem('pp_enrolled')
    setEnrolled(false)
  }

  return { enrolled, enroll, unenroll }
}
