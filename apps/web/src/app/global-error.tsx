'use client'

export default function GlobalError({
  error: _,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#dc2626', margin: '0 0 0.5rem 0' }}>
                500
              </h1>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                Application Error
              </h2>
              <p style={{ color: '#6b7280', maxWidth: '24rem', margin: '0' }}>
                A global error has occurred. Please refresh the page or try again later.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}