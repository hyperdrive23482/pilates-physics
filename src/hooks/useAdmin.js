import { useEnrollment } from './useEnrollment'

export function useAdmin() {
  const { user, loading } = useEnrollment()
  const isAdmin = user?.user_metadata?.is_admin === true
  return { isAdmin, user, loading }
}
