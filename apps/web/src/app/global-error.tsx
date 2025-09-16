'use client'

export default function GlobalError({
  error: _,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-red-600">500</h1>
              <h2 className="text-2xl font-semibold">Application Error</h2>
              <p className="text-gray-600 max-w-md">
                A global error has occurred. Please refresh the page or try again later.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={reset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}