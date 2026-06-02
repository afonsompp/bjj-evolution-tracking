import { Navigate, useParams, useSearchParams } from 'react-router-dom'

export default function ClassManagementPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  // Preserve the templates intent (?tab=templates) as the classes sub-tab.
  const sub = searchParams.get('tab') === 'templates' ? '&sub=templates' : ''
  return <Navigate to={`/academies/${id}?tab=classes${sub}`} replace />
}
