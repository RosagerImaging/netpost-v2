export default function Custom500() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#dc2626' }}>500</h1>
        <h2 style={{ fontSize: '1.5rem' }}>Internal Server Error</h2>
        <p>Sorry, something went wrong on our end.</p>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>Go Home</a>
      </div>
    </div>
  )
}