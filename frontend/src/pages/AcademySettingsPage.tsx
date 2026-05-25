import { Navigate, useParams } from 'react-router-dom'

export default function AcademySettingsPage() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/academies/${id}?tab=settings`} replace />
}
