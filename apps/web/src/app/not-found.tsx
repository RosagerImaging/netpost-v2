export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem' }}>Page Not Found</h2>
        <p>Sorry, we could not find the page you are looking for.</p>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>Go Home</a>
      </div>
    </div>
  )
}