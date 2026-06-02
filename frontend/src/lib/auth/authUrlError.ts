// Supabase reports a failed email link (expired/used) by appending the error to
// either the URL hash (implicit flow) or the query string. Returns a
// human-readable message, or null when the link carries no error.
export function readAuthUrlError(): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const description = hash.get('error_description') ?? query.get('error_description')
  const code = hash.get('error') ?? query.get('error')
  const raw = description ?? code
  return raw ? raw.replace(/\+/g, ' ') : null
}
