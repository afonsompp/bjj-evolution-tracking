import { Navigate, useParams } from 'react-router-dom'

export default function AcademyMembersPage() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/academies/${id}?tab=members`} replace />
}
