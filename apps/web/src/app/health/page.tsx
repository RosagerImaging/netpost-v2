import Link from "next/link";

async function getEnvHealth() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${base}/api/health/env`, { cache: "no-store" });
  const data = await res.json();
  return { ok: res.ok, data } as { ok: boolean; data: { status: string; missing: string[]; details: { key: string; present: boolean }[] } };
}

export default async function HealthPage() {
  const { ok, data } = await getEnvHealth();
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-2xl font-semibold">Environment Health</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {ok ? "All required env vars are present." : "Some required env vars are missing."}
      </p>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <ul className="space-y-2 text-sm">
          {data.details.map((d) => (
            <li key={d.key} className="flex items-center justify-between">
              <span className="font-mono">{d.key}</span>
              <span className={d.present ? "text-green-500" : "text-red-500"}>{d.present ? "present" : "missing"}</span>
            </li>
          ))}
        </ul>
      </div>

      {!ok && data.missing.length > 0 && (
        <div className="mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          Missing: {data.missing.join(", ")}
        </div>
      )}

      <div className="mt-8">
        <Link href="/" className="text-sm text-muted-foreground underline">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}

