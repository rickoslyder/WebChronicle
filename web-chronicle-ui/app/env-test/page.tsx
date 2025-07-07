export default function EnvTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_WORKER_URL:</strong> {process.env.NEXT_PUBLIC_WORKER_URL || 'NOT SET'}</p>
        <p><strong>NEXT_PUBLIC_AUTH_TOKEN:</strong> {process.env.NEXT_PUBLIC_AUTH_TOKEN ? '***SET***' : 'NOT SET'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'NOT SET'}</p>
      </div>
    </div>
  )
}