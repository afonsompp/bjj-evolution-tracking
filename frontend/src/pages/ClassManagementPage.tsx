import { Navigate, useParams } from 'react-router-dom'

export default function ClassManagementPage() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/academies/${id}?tab=classes`} replace />
}
